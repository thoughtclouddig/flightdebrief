import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection for every (product) page -- the enforcement layer that
 * didn't exist at all before (see lib/viewer.ts for the session lookup this
 * mirrors). Redirects to /login when there's no session. In mock mode (no
 * Supabase env vars) this is a no-op, matching how the rest of the app
 * degrades gracefully without keys configured.
 *
 * Named `proxy` (not `middleware`) per Next.js 16 -- the `middleware` file
 * convention is deprecated in favor of `proxy.ts`, same semantics/API.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Must call this (not just read a cookie) -- it's what actually refreshes an expiring session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every (product) route but not:
     * - (auth) routes (/login, /invite/*) -- would redirect-loop otherwise
     * - (marketing) routes (public, no auth needed)
     * - api routes (each one that needs auth checks getViewer() itself)
     * - static assets / Next internals
     */
    "/home",
    "/dashboard/:path*",
    "/history/:path*",
    "/next-lesson/:path*",
    "/profile/:path*",
    "/progress/:path*",
    "/flights/:path*",
    "/cfi/:path*",
    "/admin/:path*",
    "/app",
  ],
};
