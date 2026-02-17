import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log("Scraping Google Photos URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch Google Photos album: ${response.status}`);
    }

    const html = await response.text();

    // Regex to extract the JSON data from the script tag
    // We are looking for the callback that contains 'ds:0' which usually has the album data
    const regex = /AF_initDataCallback\({key: 'ds:0', hash: '[^']*', data: (\[[\s\S]*?\]), sideChannel: {[^}]*}}\);/m;
    const match = html.match(regex);

    if (!match || !match[1]) {
        console.warn("Could not find AF_initDataCallback with ds:0. Attempting fallback regex...");
        // Fallback? Sometimes format varies. For now, throw error or return empty.
        throw new Error("Failed to parse Google Photos data (ds:0 not found)");
    }

    const jsonString = match[1];
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        throw new Error("Failed to parse JSON data from Google Photos");
    }

    // The data structure is deeply nested arrays.
    // data[1] usually contains the list of items
    const items = data[1];
    if (!items || !Array.isArray(items)) {
        console.log("No items found in album data");
        return [];
    }

    const parsedItems = [];

    for (const item of items) {
        // Each item is an array.
        // item[0] = id
        // item[1] = [url, width, height]
        // item[2] = [timestamp, ...]

        if (!item[1]) continue; // skip if no media data

        const id = item[0];
        const baseUrl = item[1][0];
        const width = item[1][1];
        const height = item[1][2];

        // Timestamp is sometimes in item[2] or item[5] or derived
        // item[2] is usually creation timestamp (epoch ms)
        const timestamp = item[2] ? new Date(item[2]) : new Date();

        // Skip videos for now if they don't have a simple image representation (they usually do)
        // We just want the image URL.

        parsedItems.push({
            external_id: id,
            url: baseUrl, // This URL can be appended with =w...-h...
            width: width,
            height: height,
            captured_at: timestamp
        });
    }

    console.log(`Found ${parsedItems.length} photos in Google Photos album.`);
    return parsedItems;
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
    // Note: fetch might handle 3xx automatically, but 330 is specific to iCloud non-standard? 
    // Standard fetch follows redirects, but we might need to update the host info if it returns a specific JSON or header.
    // iCloud often returns 330 with 'X-Apple-MMe-Host' header.

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
        // derivations is an object like { "2048": { ... }, "1024": { ... } }
        const derivatives = photo.derivatives;
        if (!derivatives) return null;

        // Sort derivatives by width (descending) to get best quality
        // keys are strings, need to parse integers
        const bestKey = Object.keys(derivatives).sort((a, b) => parseInt(b) - parseInt(a))[0];
        const best = derivatives[bestKey];

        if (!best) return null;

        // iCloud URLs are constructed from checksums and a base host usually provided in the metadata or we use a standard CDN.
        // Actually, the 'url' in derivatives is usually a relative path or full URL.
        // In newer API, it might be a dictionary with 'url', 'checksum', etc.
        // If it's a relative URL, we need to construct it.
        // The simplified API usually returns full URLs in some contexts, but let's check.
        // Wait, the API returns `checksum` and `url`. If `url` is present, use it.
        // If not, we might need to construct it using `https://${partition}-sharedstreams.icloud.com/${token}/sharedstreams/${checksum}`... 
        // BUT usually the public webstream JSON has a `url` field in the derivative.

        // Fallback: The API often returns a 'url' property in the derivative object.

        return {
            external_id: photo.photoGuid,
            url: best.url, // Assuming valid URL. If relative, needs base.
            width: parseInt(best.width),
            height: parseInt(best.height),
            captured_at: photo.dateCreated ? new Date(photo.dateCreated) : new Date()
        };
    }).filter((item: any) => item !== null);

    console.log(`Found ${parsedItems.length} photos in iCloud album.`);
    return parsedItems;
}
