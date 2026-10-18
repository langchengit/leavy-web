import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** null until VITE_SUPABASE_URL and _PUBLISHABLE_KEY are set; the app then runs without accounts. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          // Google sign-in returns to the site with the session in the URL.
          detectSessionInUrl: true,
        },
      })
    : null;
