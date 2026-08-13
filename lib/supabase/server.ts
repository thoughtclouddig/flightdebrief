import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. Used by
 * SupabaseRepository once Supabase env vars are configured; the prototype
 * runs a single demo user, so RLS is bypassed here rather than threading a
 * session through every request.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return cached;
}
