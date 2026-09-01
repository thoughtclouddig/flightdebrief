import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SITE_GATE_COOKIE, isSiteGateEnabled, verifySessionJwt, verifySiteGateJwt } from "@/lib/auth/session";

// These two lists and the `matcher` at the bottom must be kept in sync, and
// the failure is silent in a misleading direction: a path added to the matcher
// but NOT to one of these falls through to the session check below and
// redirects to /login, so the page appears broken to a logged-out visitor
// rather than gated. Add to both, always.
const MARKETING_PATHS = new Set([
  "/",
  "/instructors",
  "/schools",
  "/enterprise",
  "/privacy",
  "/terms",
  "/what-is-afterflight",
  "/how-it-works",
  "/data-handling",
  "/for-instructors-quickstart",
]);

// `/demo` covers /demo/overview as well as the bare path. `/prototype` gates
// the whole prototype surface -- ~19 routes of unreleased product that sat
// completely open until now, reachable by anyone holding a direct URL even
// while the marketing site itself was gated.
const MARKETING_PREFIXES = ["/field-notes", "/research", "/demo", "/prototype"];

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
    // Carry the reason and the path. A bounce to /login is indistinguishable
    // from a logout when you are looking at it in a browser, and we spent an
    // afternoon on a production bounce that could have been one glance at the
    // URL: no cookie is a different bug from a cookie that will not verify,
    // and "which path" is the difference between a route problem and a
    // session problem.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    loginUrl.searchParams.set("reason", token ? "invalid-session" : "no-cookie");
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
    // Both entries: ":path*" does not match the bare parent, so listing only
    // the child pattern let an unauthenticated visit to /super-admin skip the
    // session check and render -- which then 404s from the staff gate,
    // reporting "no such page" when the truth was "you aren't signed in".
    "/super-admin",
    "/super-admin/:path*",
    "/app",
    "/onboarding",
    /*
     * (marketing) routes -- optional shared-password gate. /gate and
     * /api/gate are deliberately excluded (would redirect-loop otherwise);
     * (auth) routes are excluded on purpose, see the doc comment above.
     *
     * Mirror every addition into MARKETING_PATHS or MARKETING_PREFIXES at the
     * top of this file -- see the note there for what breaks if you don't.
     */
    "/",
    "/instructors",
    "/schools",
    "/enterprise",
    "/privacy",
    "/terms",
    "/what-is-afterflight",
    "/how-it-works",
    "/data-handling",
    "/for-instructors-quickstart",
    "/field-notes",
    "/field-notes/:path*",
    "/research",
    "/research/:path*",
    "/demo",
    "/demo/:path*",
    // Both the bare path and the children: ":path*" does not match the parent,
    // the same trap already documented for /super-admin above.
    "/prototype",
    "/prototype/:path*",
  ],
};
