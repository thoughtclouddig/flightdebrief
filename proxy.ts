import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SITE_GATE_COOKIE, isSiteGateEnabled, verifySessionJwt, verifySiteGateJwt } from "@/lib/auth/session";

const MARKETING_PATHS = new Set(["/", "/instructors", "/schools", "/enterprise", "/privacy", "/terms", "/what-is-afterflight"]);
const MARKETING_PREFIXES = ["/resources", "/research"];

/**
 * Route protection, in two unrelated tiers:
 *
 * 1. Every (product) page requires a real session (Replit Auth JWT -- see
 *    lib/auth/session.ts), redirecting to /login when missing or invalid.
 * 2. The public marketing site can additionally sit behind a shared-password
 *    gate (SITE_ACCESS_CODE) -- entirely optional, see isSiteGateEnabled().
 *    (auth) routes (/login, /signup/*) are deliberately NOT gated so an
 *    invited user or a self-serve signup link still works even while the
 *    marketing site itself is hidden.
 *
 * Named `proxy` (not `middleware`) per Next.js 16 -- the `middleware` file
 * convention is deprecated in favor of `proxy.ts`, same semantics/API.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (MARKETING_PATHS.has(pathname) || MARKETING_PREFIXES.some((prefix) => pathname.startsWith(`${prefix}/`) || pathname === prefix)) {
    if (!isSiteGateEnabled()) return NextResponse.next();
    const gateToken = request.cookies.get(SITE_GATE_COOKIE)?.value;
    const passed = gateToken ? await verifySiteGateJwt(gateToken) : false;
    if (!passed) {
      const gateUrl = new URL("/gate", request.url);
      gateUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(gateUrl);
    }
    return NextResponse.next();
  }

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
     * (product) routes -- real session required:
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
    /*
     * (marketing) routes -- optional shared-password gate. /gate and
     * /api/gate are deliberately excluded (would redirect-loop otherwise);
     * (auth) routes are excluded on purpose, see the doc comment above.
     */
    "/",
    "/instructors",
    "/schools",
    "/enterprise",
    "/privacy",
    "/terms",
    "/what-is-afterflight",
    "/resources",
    "/resources/:path*",
    "/research",
    "/research/:path*",
  ],
};
