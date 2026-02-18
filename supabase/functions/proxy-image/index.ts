import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    const url = new URL(req.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 })
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // Mocking a standard browser user agent often helps with strict CDNs
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        // Stream the response back
        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })
    } catch (error) {
        return new Response(`Error fetching image: ${error.message}`, { status: 500 })
    }
})
