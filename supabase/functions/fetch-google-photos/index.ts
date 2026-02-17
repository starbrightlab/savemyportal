
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { sessionId, providerToken } = await req.json()

        if (!sessionId || !providerToken) {
            throw new Error('Missing sessionId or providerToken')
        }

        console.log(`Fetching media items for session: ${sessionId}`)

        // Correct Endpoint: https://photospicker.googleapis.com/v1/mediaItems?sessionId={sessionId}
        const response = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=100`, {
            headers: {
                'Authorization': `Bearer ${providerToken}`
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Google API Error:", errorText)
            // Return 200 to prevent supabase-js from throwing, so we can read the error in frontend
            return new Response(JSON.stringify({ error: `Google API Error (${response.status}): ${errorText}` }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Function Error:", error)
        return new Response(JSON.stringify({ error: `Function Fatal Error: ${error.message}` }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
