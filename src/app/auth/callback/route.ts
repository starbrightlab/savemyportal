import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const code = searchParams.get('code')
    // Validate "next" param to prevent open redirects.
    // Must be a relative path starting with "/" and not contain "//".
    const rawNext = searchParams.get('next') ?? '/'
    const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/'

    // Derive the true origin from headers, NOT request.url.
    // On Netlify, request.url reflects the internal mutable deployment URL
    // (e.g. main--savemyportal.netlify.app), not the custom domain.
    // The real host comes from x-forwarded-host or host headers.
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = forwardedHost || request.headers.get('host') || url.host
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const origin = `${protocol}://${host}`

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error(`[AuthCallback] Error exchanging code: ${error.message}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
