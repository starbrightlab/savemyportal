import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail gracefully if credentials are missing (prevents white screen on load)
export const supabase: SupabaseClient | any = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        auth: {
            getUser: async () => ({ data: { user: null } }),
            signInWithOAuth: async () => console.warn("Supabase not configured"),
            signOut: async () => console.warn("Supabase not configured"),
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        },
        from: () => ({ select: () => ({ data: [], error: "Supabase not configured" }) }),
        functions: { invoke: async () => ({ data: null, error: "Supabase not configured" }) }
    };

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing! Check .env variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
