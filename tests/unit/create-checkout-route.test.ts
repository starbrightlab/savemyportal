import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => ({
        auth: { getUser: mockGetUser },
    })),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: mockProfileSelect,
                })),
            })),
        })),
    })),
}));

const mockSessionsCreate = vi.fn();
const mockPromotionCodesList = vi.fn();
vi.mock('stripe', () => ({
    default: vi.fn().mockImplementation(() => ({
        checkout: {
            sessions: { create: mockSessionsCreate },
        },
        promotionCodes: { list: mockPromotionCodesList },
    })),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 2, resetAt: Date.now() + 60000 })),
}));

// Import the route handler AFTER mocks are set up
import { POST } from '../../src/app/api/stripe/create-checkout/route';
import { NextRequest } from 'next/server';

// ─── Helpers ──────────────────────────────────────────────────────
function makeRequest(body?: any): NextRequest {
    return new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json',
            'origin': 'http://localhost:3000',
        },
    });
}

function setupAuth(user: { id: string } | null, error: any = null) {
    mockGetUser.mockResolvedValue({
        data: { user },
        error,
    });
}

// ─── Tests ────────────────────────────────────────────────────────
describe('POST /api/stripe/create-checkout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when user is not authenticated', async () => {
        setupAuth(null, { message: 'Not authenticated' });

        const res = await POST(makeRequest());
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when user is already Pro', async () => {
        setupAuth({ id: 'user-1' });
        mockProfileSelect.mockResolvedValue({ data: { tier: 'pro' }, error: null });

        const res = await POST(makeRequest());
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Already on Pro tier');
    });

    it('should create a checkout session for free tier user', async () => {
        setupAuth({ id: 'user-1' });
        mockProfileSelect.mockResolvedValue({ data: { tier: 'free' }, error: null });
        mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

        const res = await POST(makeRequest());
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.url).toBe('https://checkout.stripe.com/test');
        expect(mockSessionsCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: 'payment',
                metadata: { user_id: 'user-1' },
            })
        );
    });

    it('should return 400 for invalid promo code', async () => {
        setupAuth({ id: 'user-1' });
        mockProfileSelect.mockResolvedValue({ data: { tier: 'free' }, error: null });
        mockPromotionCodesList.mockResolvedValue({ data: [] });

        const res = await POST(makeRequest({ promoCode: 'INVALID' }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid or expired promo code');
    });

    it('should apply valid promo code to checkout session', async () => {
        setupAuth({ id: 'user-1' });
        mockProfileSelect.mockResolvedValue({ data: { tier: 'free' }, error: null });
        mockPromotionCodesList.mockResolvedValue({
            data: [{ id: 'promo_abc123' }],
        });
        mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/promo' });

        const res = await POST(makeRequest({ promoCode: 'LAUNCH50' }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.url).toBe('https://checkout.stripe.com/promo');
        expect(mockSessionsCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                discounts: [{ promotion_code: 'promo_abc123' }],
            })
        );
    });

    it('should return sanitized error on unexpected failure', async () => {
        setupAuth({ id: 'user-1' });
        mockProfileSelect.mockResolvedValue({ data: { tier: 'free' }, error: null });
        mockSessionsCreate.mockRejectedValue(new Error('Stripe internal error: card_declined'));

        const res = await POST(makeRequest());
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe('Something went wrong. Please try again.');
    });
});
