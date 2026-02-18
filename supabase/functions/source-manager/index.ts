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
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get User from Auth Header
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid Token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { sourceId } = await req.json()

        if (!sourceId) {
            throw new Error('Missing sourceId')
        }

        // 1. Fetch Source Details & Verify Ownership
        const { data: source, error: sourceError } = await supabaseClient
            .from('sources')
            .select('*')
            .eq('id', sourceId)
            .single()

        if (sourceError || !source) {
            throw new Error('Source not found')
        }

        if (source.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized: You do not own this source' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
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

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// --- Scraper Implementations ---


import { scrapeGooglePhotos, scrapeICloud } from './scrapers.ts'

