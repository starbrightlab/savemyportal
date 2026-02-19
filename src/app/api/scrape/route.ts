import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { scrapeGooglePhotos, scrapeICloud } from '@/lib/scrapers';
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
    let serviceClient: ReturnType<typeof createServiceClient<Database>> | null = null;
    let sourceId: string | null = null;

    try {
        // 1. Authenticate via cookies (handled automatically by the server client)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        sourceId = body.sourceId;

        if (!sourceId) {
            return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 });
        }

        // 2. Verify source ownership using the authenticated client (respects RLS)
        const { data: source, error: sourceError } = await supabase
            .from('sources')
            .select('*')
            .eq('id', sourceId)
            .single();

        if (sourceError || !source) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        // RLS already ensures user can only see their own sources, but double-check
        if (source.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log(`Processing source: ${source.type} - ${source.url}`);

        // 3. Route to specific scraper
        let items: Awaited<ReturnType<typeof scrapeGooglePhotos>> = [];

        if (source.type === 'google_photos') {
            items = await scrapeGooglePhotos(source.url);
        } else if (source.type === 'icloud') {
            items = await scrapeICloud(source.url);
        } else if (source.type === 'dropbox') {
            items = [];
        } else {
            return NextResponse.json({ error: `Unknown source type: ${source.type}` }, { status: 400 });
        }

        // 4. Upsert items using service role client (source_items has no INSERT RLS policy)
        serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPERBASE_SERVICE_ROLE_KEY!
        );

        if (items.length > 0) {
            const rows: Database['public']['Tables']['source_items']['Insert'][] = items.map(item => ({
                source_id: sourceId!,
                external_id: item.external_id,
                url: item.url,
                width: item.width,
                height: item.height,
                captured_at: item.captured_at ? item.captured_at.toISOString() : null,
                media_type: item.media_type,
                video_url: item.video_url,
            }));

            const { error: upsertError } = await serviceClient.from('source_items').upsert(rows, { onConflict: 'source_id, external_id' });
            if (upsertError) throw upsertError;
        }

        // 5. Update source status
        await serviceClient.from('sources').update({
            last_scraped_at: new Date().toISOString(),
            status: 'active',
            error_message: null,
        }).eq('id', sourceId);

        return NextResponse.json({ success: true, count: items.length });

    } catch (error) {
        const errorMsg = (error as Error).message || String(error);
        console.error("Scraper Error:", errorMsg);

        // Save error to source record so it's visible in the dashboard
        if (serviceClient && sourceId) {
            try {
                await serviceClient.from('sources').update({
                    status: 'error',
                    error_message: errorMsg,
                }).eq('id', sourceId);
            } catch (_e) { /* best effort */ }
        }

        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
