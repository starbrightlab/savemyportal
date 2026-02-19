import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => ({
        auth: { getUser: mockGetUser },
    })),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        auth: {
            admin: {
                deleteUser: mockDeleteUser,
            },
        },
    })),
}));

// Import the route handler AFTER mocks are set up
import { POST } from '../../src/app/api/delete-account/route';

// ─── Tests ────────────────────────────────────────────────────────
describe('POST /api/delete-account', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
        });

        const res = await POST();
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('should delete user and return success', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });
        mockDeleteUser.mockResolvedValue({ error: null });

        const res = await POST();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should return 500 when delete fails', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });
        mockDeleteUser.mockResolvedValue({
            error: { message: 'Internal server error' },
        });

        const res = await POST();
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toContain('Failed to delete account');
    });
});
