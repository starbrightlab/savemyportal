import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_HOSTS = [
    'lh3.googleusercontent.com',
    'lh4.googleusercontent.com',
    'lh5.googleusercontent.com',
    'lh6.googleusercontent.com',
    '.googleusercontent.com',
    '.ggpht.com',
    '.icloud-content.com',
    '.apple.com',
    '.dropboxusercontent.com',
]

function isAllowedUrl(targetUrl: string): boolean {
    let parsed: URL
    try {
        parsed = new URL(targetUrl)
    } catch {
        return false
    }

    if (parsed.protocol !== 'https:') return false

    const hostname = parsed.hostname.toLowerCase()
    return ALLOWED_HOSTS.some(allowed => {
        if (allowed.startsWith('.')) {
            return hostname.endsWith(allowed) || hostname === allowed.slice(1)
        }
        return hostname === allowed
    })
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const url = new URL(req.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    if (!isAllowedUrl(targetUrl)) {
        return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow',
        })

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

        // Only proxy image content types
        if (!contentType.startsWith('image/')) {
            return new Response(JSON.stringify({ error: 'Response is not an image' }), {
                status: 422,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                ...corsHeaders,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
