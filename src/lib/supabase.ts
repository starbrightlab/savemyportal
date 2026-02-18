import { createClient } from './supabase/client';

// Export a singleton for client-side usage to maintain backward compatibility.
// NOTE: This client is only safe for use in Client Components.
// For Server Components, import { createClient } from '@/lib/supabase/server';
export const supabase = createClient();
