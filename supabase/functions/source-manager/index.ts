import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scrapeGooglePhotos, scrapeICloud } from './scrapers.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    let supabaseClient: any = null
    let sourceId: string | null = null

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        supabaseClient = createClient(
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

        const body = await req.json()
        sourceId = body.sourceId

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
            // Build rows — include media_type/video_url when available
            const rows = items.map(item => {
                const row: Record<string, any> = {
                    source_id: sourceId,
                    external_id: item.external_id,
                    url: item.url,
                    width: item.width,
                    height: item.height,
                    captured_at: item.captured_at ? new Date(item.captured_at) : null,
                }
                // Only include video columns if the scraper returned them
                // This keeps the function backwards-compatible before the migration is applied
                if (item.media_type) row.media_type = item.media_type
                if (item.video_url) row.video_url = item.video_url
                return row
            })

            let upsertError: any = null

            // Try with video columns first
            const result = await supabaseClient.from('source_items').upsert(rows, { onConflict: 'source_id, external_id' })
            upsertError = result.error

            // If it fails (e.g. columns don't exist yet), retry without video columns
            if (upsertError) {
                console.warn('Upsert with video columns failed, retrying without:', upsertError.message)
                const fallbackRows = items.map(item => ({
                    source_id: sourceId,
                    external_id: item.external_id,
                    url: item.url,
                    width: item.width,
                    height: item.height,
                    captured_at: item.captured_at ? new Date(item.captured_at) : null,
                }))
                const fallbackResult = await supabaseClient.from('source_items').upsert(fallbackRows, { onConflict: 'source_id, external_id' })
                if (fallbackResult.error) throw fallbackResult.error
            }
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
        const errorMsg = error.message || String(error)
        console.error("Scraper Error:", errorMsg)

        // Save error to source record so it's visible in the dashboard
        if (supabaseClient && sourceId) {
            try {
                await supabaseClient.from('sources').update({
                    status: 'error',
                    error_message: errorMsg,
                }).eq('id', sourceId)
            } catch (_e) { /* best effort */ }
        }

        return new Response(JSON.stringify({ error: errorMsg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// --- Scraper Implementations imported at top of file ---

