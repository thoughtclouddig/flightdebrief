import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionJwt } from "@/lib/auth/session";

/**
 * Route protection for every (product) page. Verifies the Replit Auth
 * session cookie (a signed JWT -- see lib/auth/session.ts) and redirects to
 * /login when it's missing or invalid.
 *
 * Named `proxy` (not `middleware`) per Next.js 16 -- the `middleware` file
 * convention is deprecated in favor of `proxy.ts`, same semantics/API.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionJwt(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every (product) route but not:
     * - (auth) routes (/login) -- would redirect-loop otherwise
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
    "/onboarding",
  ],
};
