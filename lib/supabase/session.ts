import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Request-scoped, cookie-aware Supabase client (anon key) -- answers "who is
 * signed in right now." Distinct from lib/supabase/server.ts's service-role
 * singleton, which is used for all actual data access via SupabaseRepository
 * and has no notion of a session.
 *
 * A new client must be created per request (never cached/shared) per
 * @supabase/ssr's own guidance. Returns null when Supabase env vars aren't
 * configured, matching the rest of the app's mock/live gating.
 */
export async function getSupabaseSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component -- cookies() is read-only there.
          // Middleware is responsible for refreshing the session in that case.
        }
      },
    },
  });
}
