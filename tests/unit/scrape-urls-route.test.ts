import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────
// Mock the Supabase server client
const mockGetUser = vi.fn();
const mockInResult = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => ({
        auth: { getUser: mockGetUser },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                in: mockInResult,
            })),
        })),
    })),
}));

// Mock the service client (used for status updates + tier lookup)
const mockProfileSingle = vi.fn().mockResolvedValue({ data: { tier: 'pro' }, error: null });
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
            if (table === 'user_profiles') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: mockProfileSingle,
                        })),
                    })),
                };
            }
            return {
                update: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        then: vi.fn(() => ({ catch: vi.fn() })),
                    })),
                })),
            };
        }),
    })),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })),
}));

// Mock scrapers
const mockScrapeGoogle = vi.fn();
const mockScrapeICloud = vi.fn();
vi.mock('@/lib/scrapers', () => ({
    scrapeGooglePhotos: (...args: any[]) => mockScrapeGoogle(...args),
    scrapeICloud: (...args: any[]) => mockScrapeICloud(...args),
}));

// Import the route handler AFTER mocks are set up
import { POST } from '../../src/app/api/scrape-urls/route';
import { NextRequest } from 'next/server';

// ─── Helpers ──────────────────────────────────────────────────────
function makeRequest(body: any): NextRequest {
    return new NextRequest('http://localhost/api/scrape-urls', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}

function setupAuth(user: { id: string } | null, error: any = null) {
    mockGetUser.mockResolvedValue({
        data: { user },
        error,
    });
}

function setupSources(sources: any[], error: any = null) {
    mockInResult.mockResolvedValue({ data: sources, error });
}

// ─── Tests ────────────────────────────────────────────────────────
describe('POST /api/scrape-urls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when user is not authenticated', async () => {
        setupAuth(null, { message: 'Not authenticated' });

        const res = await POST(makeRequest({ sourceIds: ['src-1'] }));
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when sourceIds is missing', async () => {
        setupAuth({ id: 'user-1' });

        const res = await POST(makeRequest({}));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Missing or empty sourceIds');
    });

    it('should return 400 when sourceIds is empty array', async () => {
        setupAuth({ id: 'user-1' });

        const res = await POST(makeRequest({ sourceIds: [] }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Missing or empty sourceIds');
    });

    it('should return 404 when no sources are found', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([]);

        const res = await POST(makeRequest({ sourceIds: ['src-1'] }));
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toBe('No sources found');
    });

    it('should return 403 when source belongs to another user', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([{ id: 'src-1', type: 'google_photos', url: 'https://photos.app.goo.gl/test', user_id: 'user-2' }]);

        const res = await POST(makeRequest({ sourceIds: ['src-1'] }));
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('Unauthorized');
    });

    it('should scrape Google Photos source and return items', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([{ id: 'src-1', type: 'google_photos', url: 'https://photos.app.goo.gl/test', user_id: 'user-1' }]);

        mockScrapeGoogle.mockResolvedValue([
            {
                external_id: 'photo-1',
                url: 'https://lh3.googleusercontent.com/photo1',
                width: 1920,
                height: 1080,
                captured_at: new Date('2024-01-01'),
                media_type: 'image',
                video_url: null,
            },
        ]);

        const res = await POST(makeRequest({ sourceIds: ['src-1'] }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.count).toBe(1);
        expect(data.items).toHaveLength(1);
        expect(data.items[0]).toMatchObject({
            source_id: 'src-1',
            external_id: 'photo-1',
            url: 'https://lh3.googleusercontent.com/photo1',
            media_type: 'image',
        });
        expect(mockScrapeGoogle).toHaveBeenCalledWith('https://photos.app.goo.gl/test');
    });

    it('should scrape iCloud source and return items', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([{ id: 'src-2', type: 'icloud', url: 'https://www.icloud.com/sharedalbum/#ABC123', user_id: 'user-1' }]);

        mockScrapeICloud.mockResolvedValue([
            {
                external_id: 'icloud-1',
                url: 'https://cvws.icloud-content.com/image.jpg',
                width: 800,
                height: 600,
                captured_at: new Date('2024-06-15'),
                media_type: 'image',
                video_url: null,
            },
        ]);

        const res = await POST(makeRequest({ sourceIds: ['src-2'] }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.count).toBe(1);
        expect(data.items[0].source_id).toBe('src-2');
        expect(mockScrapeICloud).toHaveBeenCalledWith('https://www.icloud.com/sharedalbum/#ABC123');
    });

    it('should scrape multiple sources in parallel', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([
            { id: 'src-1', type: 'google_photos', url: 'https://photos.app.goo.gl/a', user_id: 'user-1' },
            { id: 'src-2', type: 'icloud', url: 'https://www.icloud.com/sharedalbum/#B', user_id: 'user-1' },
        ]);

        mockScrapeGoogle.mockResolvedValue([
            { external_id: 'g1', url: 'https://lh3.googleusercontent.com/g1', width: 100, height: 100, captured_at: new Date(), media_type: 'image', video_url: null },
        ]);
        mockScrapeICloud.mockResolvedValue([
            { external_id: 'i1', url: 'https://cvws.icloud-content.com/i1.jpg', width: 200, height: 200, captured_at: new Date(), media_type: 'image', video_url: null },
        ]);

        const res = await POST(makeRequest({ sourceIds: ['src-1', 'src-2'] }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.count).toBe(2);
        expect(data.items.map((i: any) => i.source_id).sort()).toEqual(['src-1', 'src-2']);
    });

    it('should handle partial failures gracefully', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([
            { id: 'src-1', type: 'google_photos', url: 'https://photos.app.goo.gl/good', user_id: 'user-1' },
            { id: 'src-2', type: 'google_photos', url: 'https://photos.app.goo.gl/bad', user_id: 'user-1' },
        ]);

        mockScrapeGoogle
            .mockResolvedValueOnce([
                { external_id: 'g1', url: 'https://lh3.googleusercontent.com/g1', width: 100, height: 100, captured_at: new Date(), media_type: 'image', video_url: null },
            ])
            .mockRejectedValueOnce(new Error('Album not found'));

        const res = await POST(makeRequest({ sourceIds: ['src-1', 'src-2'] }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.count).toBe(1);
        expect(data.errors).toHaveLength(1);
        expect(data.errors[0]).toContain('Album not found');
    });

    it('should handle unknown source type', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([{ id: 'src-1', type: 'dropbox', url: 'https://dropbox.com/share', user_id: 'user-1' }]);

        const res = await POST(makeRequest({ sourceIds: ['src-1'] }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.count).toBe(0);
        expect(data.items).toHaveLength(0);
    });

    it('should include video items with video_url', async () => {
        setupAuth({ id: 'user-1' });
        setupSources([{ id: 'src-1', type: 'google_photos', url: 'https://photos.app.goo.gl/test', user_id: 'user-1' }]);

        mockScrapeGoogle.mockResolvedValue([
            {
                external_id: 'vid-1',
                url: 'https://lh3.googleusercontent.com/vid1',
                width: 1920,
                height: 1080,
                captured_at: new Date('2024-03-01'),
                media_type: 'video',
                video_url: 'https://lh3.googleusercontent.com/vid1=dv',
            },
        ]);

        const res = await POST(makeRequest({ sourceIds: ['src-1'] }));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.items[0].media_type).toBe('video');
        expect(data.items[0].video_url).toBe('https://lh3.googleusercontent.com/vid1=dv');
    });
});
