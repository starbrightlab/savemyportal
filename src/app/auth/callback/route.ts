import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect target
    const next = searchParams.get('next') ?? '/'

    // Determine the base URL for redirection
    // In production/preview, we want to respect the environment URL if set, 
    // but for previews, the origin request came from is usually best.
    // However, if the user complains about "random subdomains", we might want to force the site URL.
    // Let's try to use the request origin to ensure the cookie set corresponds to the domain the user is on.
    // If we redirect to a different domain, the cookie might effectively be lost (cross-domain).
    // So sticking to `origin` is technically correct for Auth flow stability.
    // But let's log it clearly.
    const baseUrl = origin; // Keep origin to match cookie domain context

    console.log(`[AuthCallback] Hit with code: ${!!code}, next: ${next}, origin: ${origin}`);

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
                        console.log(`[AuthCallback] Setting cookie: ${name}`);
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
            console.log(`[AuthCallback] Session exchanged successfully. Redirecting to ${next}`);
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error(`[AuthCallback] Error exchanging code: ${error.message}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
