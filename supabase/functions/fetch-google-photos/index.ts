
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

        const response = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}/mediaItems?pageSize=100`, {
            headers: {
                'Authorization': `Bearer ${providerToken}`
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Google API Error:", errorText)
            return new Response(JSON.stringify({ error: errorText }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Function Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
