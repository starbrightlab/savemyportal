
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
        const { url, providerToken } = await req.json()

        if (!url || !providerToken) {
            throw new Error('Missing url or providerToken')
        }

        console.log(`Proxying request to: ${url}`)

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${providerToken}`
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Google Proxy Error:", errorText)
            return new Response(JSON.stringify({ error: `Google API Error (${response.status}): ${errorText}` }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Convert to Base64 to safely return via JSON-based invoke()
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new Response(JSON.stringify({
            data: base64,
            contentType: contentType
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Attributes Proxy Error:", error)
        return new Response(JSON.stringify({ error: `Proxy Error: ${error.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
