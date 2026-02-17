import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchImageUrls } from "https://esm.sh/google-photos-album-image-url-fetch";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { sourceId } = await req.json()

        if (!sourceId) {
            throw new Error('Missing sourceId')
        }

        // 1. Fetch Source Details
        const { data: source, error: sourceError } = await supabaseClient
            .from('sources')
            .select('*')
            .eq('id', sourceId)
            .single()

        if (sourceError || !source) {
            throw new Error('Source not found')
        }


        console.log(`Processing source: ${source.type} - ${source.url}`)

        let items = []

        // 2. Route to specific scraper
        if (source.type === 'google_photos') {
            items = await scrapeGooglePhotos(source.url)
        } else if (source.type === 'icloud') {
            items = await scrapeICloud(source.url)
        } else if (source.type === 'dropbox') {
            // Placeholder for Dropbox
            items = []
        } else {
            throw new Error(`Unknown source type: ${source.type}`)
        }

        // 3. Upsert items
        if (items.length > 0) {
            const { error: upsertError } = await supabaseClient.from('source_items').upsert(
                items.map(item => ({
                    source_id: sourceId,
                    external_id: item.external_id,
                    url: item.url,
                    width: item.width,
                    height: item.height,
                    captured_at: item.captured_at ? new Date(item.captured_at) : null
                })),
                { onConflict: 'source_id, external_id' }
            )

            if (upsertError) throw upsertError
        }

        // 4. Update source status
        await supabaseClient.from('sources').update({
            last_scraped_at: new Date(),
            status: 'active',
            error_message: null
        }).eq('id', sourceId)

        return new Response(JSON.stringify({ success: true, count: items.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Scraper Error:", error)

        // Attempt to update source with error status if we have a sourceId
        // (This is tricky if the request didn't provide one, but we wrap the logic)

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// --- Scraper Implementations ---

async function scrapeGooglePhotos(url: string) {
    console.log("Scraping Google Photos URL using library:", url);

    try {
        const results = await fetchImageUrls(url);

        if (!results || !Array.isArray(results)) {
            console.warn("Library returned invalid data:", results);
            return [];
        }

        console.log(`Library found ${results.length} items`);

        // The library returns objects like:
        // { url: string, width: number, height: number }
        // We'll generate a consistent-ish external_id from the URL or random if needed.
        // Google Photos URLs are long and unique enough.

        const parsedItems = results.map(item => {
            // Generate a simple ID from the URL hash if possible, or random.
            // item.url is unique per photo version, but stable enough for now.
            // We can use a simple hash of the URL as external_id.

            // Simple hash function for ID
            let hash = 0;
            for (let i = 0; i < item.url.length; i++) {
                hash = ((hash << 5) - hash) + item.url.charCodeAt(i);
                hash |= 0; // Convert to 32bit integer
            }
            const id = 'gp_' + Math.abs(hash).toString(16);

            return {
                external_id: id,
                url: item.url,
                width: item.width,
                height: item.height,
                captured_at: new Date() // Library doesn't return timestamp unfortunately
            };
        });

        return parsedItems;

    } catch (e) {
        console.error("Library Scraper Error:", e);
        throw new Error(`Google Photos Library Error: ${e.message}`);
    }
}


async function scrapeICloud(url: string) {
    console.log("Scraping iCloud URL:", url);

    // Extract token from URL (e.g. https://www.icloud.com/sharedalbum/#B0NGrq0zwGrap7)
    const tokenMatch = url.match(/#([a-zA-Z0-9]+)/);
    if (!tokenMatch || !tokenMatch[1]) {
        throw new Error("Invalid iCloud URL: Could not find album token");
    }
    const token = tokenMatch[1];

    // Default partition to start with
    let partition = 'p64';
    let streamUrl = `https://${partition}-sharedstreams.icloud.com/${token}/sharedstreams/webstream`;

    // Helper to fetch stream data
    const fetchStream = async (url: string) => {
        return await fetch(url, {
            method: 'POST',
            headers: {
                'Origin': 'https://www.icloud.com',
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({ streamCtag: null })
        });
    };

    let response = await fetchStream(streamUrl);

    // Handle 330 Redirect (wrong partition)
    if (response.status === 330 || (response.status >= 300 && response.status < 400)) {
        const newHost = response.headers.get('X-Apple-MMe-Host');
        if (newHost) {
            console.log(`Redirecting to new partition host: ${newHost}`);
            streamUrl = `https://${newHost}/${token}/sharedstreams/webstream`;
            response = await fetchStream(streamUrl);
        }
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch iCloud stream: ${response.status}`);
    }

    const data = await response.json();
    const photos = data.photos;

    if (!photos || !Array.isArray(photos)) {
        console.log("No photos found in iCloud stream");
        return [];
    }

    // Map to common format
    const parsedItems = photos.map((photo: any) => {
        // Find the best derivative (largest image)
        const derivatives = photo.derivatives;
        if (!derivatives) return null;

        // Sort derivatives by width (descending) to get best quality
        const bestKey = Object.keys(derivatives).sort((a, b) => parseInt(b) - parseInt(a))[0];
        const best = derivatives[bestKey];

        if (!best) return null;

        return {
            external_id: photo.photoGuid,
            url: best.url,
            width: parseInt(best.width),
            height: parseInt(best.height),
            captured_at: photo.dateCreated ? new Date(photo.dateCreated) : new Date()
        };
    }).filter((item: any) => item !== null);

    console.log(`Found ${parsedItems.length} photos in iCloud album.`);
    return parsedItems;
}
