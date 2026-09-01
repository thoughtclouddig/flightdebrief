import { verifySessionJwt, type SessionClaims } from "@/lib/auth/session";

/**
 * Bearer-token auth for the mobile client.
 *
 * The same JWT the web app mints, presented in an Authorization header
 * instead of a cookie. Deliberately not a second identity system: a phone and
 * a browser signing in as different principals would mean two account
 * lifecycles to keep in agreement, and a student whose flights land under the
 * wrong one.
 *
 * Cookies are not an option here -- a native app has no cookie jar shared
 * with the browser, and SameSite would defeat it anyway -- but the token is
 * identical and `purpose: "session"` still gates it, so a magic-link token
 * cannot be replayed as a mobile session.
 */
export interface MobileAuth {
  claims: SessionClaims;
}

export async function authenticateMobile(request: Request): Promise<MobileAuth | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const claims = await verifySessionJwt(header.slice("Bearer ".length).trim());
  return claims ? { claims } : null;
}

/** 401 with no detail. An auth failure must not describe why. */
export function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
