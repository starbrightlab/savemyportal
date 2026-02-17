import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    console.error("Supabase credentials missing! Check .env variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
}
