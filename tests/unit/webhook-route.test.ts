import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────
const mockUpsert = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            upsert: mockUpsert,
        })),
    })),
}));

const mockConstructEvent = vi.fn();
vi.mock('stripe', () => ({
    default: vi.fn().mockImplementation(() => ({
        webhooks: {
            constructEvent: mockConstructEvent,
        },
    })),
}));

// Import the route handler AFTER mocks are set up
import { POST } from '../../src/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';

// ─── Helpers ──────────────────────────────────────────────────────
function makeRequest(body: string, sig?: string): NextRequest {
    const headers: Record<string, string> = { 'Content-Type': 'text/plain' };
    if (sig) headers['stripe-signature'] = sig;

    return new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body,
        headers,
    });
}

// ─── Tests ────────────────────────────────────────────────────────
describe('POST /api/stripe/webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 when stripe-signature header is missing', async () => {
        const res = await POST(makeRequest('{}'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Missing stripe-signature header');
    });

    it('should return 400 when signature verification fails', async () => {
        mockConstructEvent.mockImplementation(() => {
            throw new Error('Signature verification failed');
        });

        const res = await POST(makeRequest('{}', 'invalid_sig'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Webhook Error');
    });

    it('should upgrade user to Pro on checkout.session.completed', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_123',
                    metadata: { user_id: 'user-1' },
                },
            },
        });
        mockUpsert.mockResolvedValue({ error: null });

        const res = await POST(makeRequest('{}', 'valid_sig'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: 'user-1',
                tier: 'pro',
                stripe_payment_id: 'cs_test_123',
            }),
            { onConflict: 'user_id' }
        );
    });

    it('should return 400 when user_id is missing from metadata', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: {
                object: { id: 'cs_test_123', metadata: {} },
            },
        });

        const res = await POST(makeRequest('{}', 'valid_sig'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Missing user_id');
    });

    it('should return 500 when profile upsert fails', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_123',
                    metadata: { user_id: 'user-1' },
                },
            },
        });
        mockUpsert.mockResolvedValue({ error: { message: 'Database error' } });

        const res = await POST(makeRequest('{}', 'valid_sig'));
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toContain('Failed to update user tier');
    });

    it('should acknowledge unhandled event types', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'charge.refunded',
            data: { object: {} },
        });

        const res = await POST(makeRequest('{}', 'valid_sig'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.received).toBe(true);
        // Should not call upsert for unhandled events
        expect(mockUpsert).not.toHaveBeenCalled();
    });
});
