"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client -- only usable once NEXT_PUBLIC_SUPABASE_* env vars are set. */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
