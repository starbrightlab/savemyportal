import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail gracefully if credentials are missing (prevents white screen on load)
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        auth: {
            getUser: async () => ({ data: { user: null } }),
            signInWithOAuth: async () => console.warn("Supabase not configured"),
            signOut: async () => console.warn("Supabase not configured")
        },
        from: () => ({ select: () => ({ data: [], error: "Supabase not configured" }) })
    };

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing! Check .env variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
