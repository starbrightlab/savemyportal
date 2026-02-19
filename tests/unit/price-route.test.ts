import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────
const mockPricesRetrieve = vi.fn();
const mockCouponsRetrieve = vi.fn();

vi.mock('stripe', () => ({
    default: vi.fn().mockImplementation(() => ({
        prices: { retrieve: mockPricesRetrieve },
        coupons: { retrieve: mockCouponsRetrieve },
    })),
}));

// Import the route handler AFTER mocks are set up
import { GET } from '../../src/app/api/stripe/price/route';

// ─── Tests ────────────────────────────────────────────────────────
describe('GET /api/stripe/price', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return base price without discount when no coupon', async () => {
        mockPricesRetrieve.mockResolvedValue({
            unit_amount: 999,
            currency: 'usd',
        });
        // No coupon configured
        const origCoupon = process.env.STRIPE_LAUNCH_COUPON_ID;
        delete process.env.STRIPE_LAUNCH_COUPON_ID;

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.basePrice).toBe(9.99);
        expect(data.currency).toBe('usd');
        expect(data.discountActive).toBe(false);
        expect(data.finalPrice).toBe(9.99);

        // Restore
        if (origCoupon) process.env.STRIPE_LAUNCH_COUPON_ID = origCoupon;
    });

    it('should apply percent_off coupon discount', async () => {
        mockPricesRetrieve.mockResolvedValue({
            unit_amount: 1000,
            currency: 'usd',
        });
        mockCouponsRetrieve.mockResolvedValue({
            valid: true,
            percent_off: 50,
            amount_off: null,
        });
        process.env.STRIPE_LAUNCH_COUPON_ID = 'test_coupon';

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.basePrice).toBe(10);
        expect(data.discountActive).toBe(true);
        expect(data.discountPercent).toBe(50);
        expect(data.finalPrice).toBe(5);
    });

    it('should apply amount_off coupon discount', async () => {
        mockPricesRetrieve.mockResolvedValue({
            unit_amount: 1000,
            currency: 'usd',
        });
        mockCouponsRetrieve.mockResolvedValue({
            valid: true,
            percent_off: null,
            amount_off: 300,
        });
        process.env.STRIPE_LAUNCH_COUPON_ID = 'test_coupon';

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.discountActive).toBe(true);
        expect(data.finalPrice).toBe(7);
    });

    it('should ignore invalid coupon', async () => {
        mockPricesRetrieve.mockResolvedValue({
            unit_amount: 999,
            currency: 'usd',
        });
        mockCouponsRetrieve.mockResolvedValue({ valid: false });
        process.env.STRIPE_LAUNCH_COUPON_ID = 'expired_coupon';

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.discountActive).toBe(false);
        expect(data.finalPrice).toBe(9.99);
    });

    it('should handle coupon retrieval failure gracefully', async () => {
        mockPricesRetrieve.mockResolvedValue({
            unit_amount: 999,
            currency: 'usd',
        });
        mockCouponsRetrieve.mockRejectedValue(new Error('Coupon not found'));
        process.env.STRIPE_LAUNCH_COUPON_ID = 'nonexistent';

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.discountActive).toBe(false);
        expect(data.finalPrice).toBe(9.99);
    });

    it('should return 500 when price retrieval fails', async () => {
        mockPricesRetrieve.mockRejectedValue(new Error('Stripe API error'));

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBeDefined();
    });
});
