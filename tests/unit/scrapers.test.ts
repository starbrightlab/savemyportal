
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeGooglePhotos, scrapeICloud } from '../../src/lib/scrapers';

// Mock global fetch
global.fetch = vi.fn();

describe('scrapeGooglePhotos', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should parse valid Google Photos HTML correctly', async () => {
        const mockHtml = `
            <html>
                <script>AF_initDataCallback({key: '123', isError: false, hash: '1', data: ["123", [["photo1", ["https://lh3.googleusercontent.com/photo1", 100, 100], 1600000000000]]]})</script>
            </html>
        `;

        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: async () => mockHtml,
        });

        const result = await scrapeGooglePhotos('https://photos.app.goo.gl/test');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            external_id: 'photo1',
            url: 'https://lh3.googleusercontent.com/photo1',
            width: 100,
            height: 100,
            captured_at: new Date(1600000000000),
            media_type: 'image',
            video_url: null,
        });
    });

    it('should handle regex failures gracefully', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: async () => '<html>No data here</html>',
        });

        const result = await scrapeGooglePhotos('https://photos.app.goo.gl/empty');
        expect(result).toEqual([]);
    });

    it('should throw error on failed fetch', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 404,
        });

        await expect(scrapeGooglePhotos('https://photos.app.goo.gl/bad')).rejects.toThrow('Failed to fetch Google Photos album: 404');
    });
});

describe('scrapeICloud', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should throw on invalid URL', async () => {
        await expect(scrapeICloud('https://icloud.com/no-token')).rejects.toThrow('Invalid iCloud URL');
    });

    // Valid mocking for iCloud is complex due to multiple fetches (stream, assets). 
    // We will test the initial flow.
    it('should fetch and parse iCloud data', async () => {
        // Mock stream response
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    photos: [{ photoGuid: 'p1', dateCreated: '2023-01-01T00:00:00Z', derivatives: { '1': { width: '100', height: '100', checksum: 'c1' } } }]
                })
            })
            // Mock asset response
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    locations: { 'loc1': { hosts: ['cvws.icloud-content.com'], scheme: 'https' } },
                    items: { 'c1': { url_location: 'loc1', url_path: '/image.jpg' } }
                })
            });

        const result = await scrapeICloud('https://www.icloud.com/sharedalbum/#B0N12345');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            external_id: 'p1',
            url: 'https://cvws.icloud-content.com/image.jpg',
            width: 100,
            height: 100
        });
    });
});
