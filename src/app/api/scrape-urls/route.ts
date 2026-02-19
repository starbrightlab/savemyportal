import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { scrapeGooglePhotos, scrapeICloud } from '@/lib/scrapers';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Database } from '@/lib/database.types';

/**
 * POST /api/scrape-urls
 *
 * On-demand scraping endpoint — returns fresh CDN URLs directly to the caller
 * without storing them in the database. Each device/session gets its own URLs
 * so token/session-specific CDN links always work.
 *
 * Body: { sourceIds: string[] }
 * Returns: { items: Array<{ source_id, external_id, url, width, height, media_type, video_url }> }
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate via cookies
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { allowed } = checkRateLimit(`scrape:${user.id}`, { maxRequests: 5 });
        if (!allowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
        }

        const body = await request.json();
        const sourceIds: string[] = body.sourceIds;

        if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
            return NextResponse.json({ error: 'Missing or empty sourceIds array' }, { status: 400 });
        }

        // 2. Fetch sources (RLS ensures user can only see their own)
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('id, type, url, user_id')
            .in('id', sourceIds);

        if (sourcesError) {
            throw sourcesError;
        }

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: 'No sources found' }, { status: 404 });
        }

        // Double-check ownership
        const unauthorized = sources.find(s => s.user_id !== user.id);
        if (unauthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 3. Scrape all sources in parallel
        const scrapeResults = await Promise.allSettled(
            sources.map(async (source) => {
                console.log(`Scraping source ${source.id}: ${source.type} - ${source.url}`);

                let items: Awaited<ReturnType<typeof scrapeGooglePhotos>> = [];

                if (source.type === 'google_photos') {
                    items = await scrapeGooglePhotos(source.url);
                } else if (source.type === 'icloud') {
                    items = await scrapeICloud(source.url);
                } else {
                    console.warn(`Unknown source type: ${source.type}`);
                    return { source_id: source.id, items: [], error: null };
                }

                return { source_id: source.id, items, error: null };
            })
        );

        // 4. Collect results — include partial successes
        const allItems: Array<{
            source_id: string;
            external_id: string;
            url: string;
            width: number;
            height: number;
            captured_at: string | null;
            media_type: 'image' | 'video';
            video_url: string | null;
        }> = [];
        const errors: string[] = [];

        for (const result of scrapeResults) {
            if (result.status === 'fulfilled') {
                const { source_id, items } = result.value;
                for (const item of items) {
                    allItems.push({
                        source_id,
                        external_id: item.external_id,
                        url: item.url,
                        width: item.width,
                        height: item.height,
                        captured_at: item.captured_at ? item.captured_at.toISOString() : null,
                        media_type: item.media_type,
                        video_url: item.video_url,
                    });
                }
            } else {
                const errMsg = (result.reason as Error)?.message || String(result.reason);
                console.error('Source scrape failed:', errMsg);
                errors.push(errMsg);
            }
        }

        // 5. Update source status in the background (best-effort, don't block response)
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update all successfully scraped sources
        for (const result of scrapeResults) {
            if (result.status === 'fulfilled') {
                const { source_id } = result.value;
                serviceClient.from('sources').update({
                    last_scraped_at: new Date().toISOString(),
                    status: 'active',
                    error_message: null,
                }).eq('id', source_id).then(
                    () => {},
                    (err) => console.error(`Failed to update source status for ${source_id}:`, err)
                );
            }
        }

        // 6. Tier-based video filtering — free tier gets photos only
        const { data: profile } = await serviceClient
            .from('user_profiles')
            .select('tier')
            .eq('user_id', user.id)
            .single();

        const filteredItems = profile?.tier === 'pro'
            ? allItems
            : allItems.filter(item => item.media_type !== 'video');

        return NextResponse.json({
            items: filteredItems,
            count: filteredItems.length,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error('Scrape URLs Error:', (error as Error).message || error);
        return NextResponse.json({ error: 'Failed to load photos. Please try again.' }, { status: 500 });
    }
}
