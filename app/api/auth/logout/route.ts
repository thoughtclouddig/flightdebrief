import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { appOrigin } from "@/lib/email";

/**
 * Clears the app session cookie.
 *
 * A GET with a side effect, which is a shape anything that speculatively
 * fetches links will trip: next/link prefetches an href as soon as it scrolls
 * into view, and a Link pointing here signed the user out just by rendering
 * the header that contained it. The staff nav did exactly that, and the
 * symptom was unrecognisable -- every /super-admin sub-page redirected to
 * /login while /super-admin itself, already rendered, looked fine.
 *
 * So: refuse to act on a prefetch. Next sets Next-Router-Prefetch; browsers
 * set Sec-Purpose (and older ones Purpose) for speculative fetches. None of
 * them are a user asking to sign out.
 */
function isPrefetch(request: NextRequest): boolean {
  const h = request.headers;
  return (
    h.get("next-router-prefetch") === "1" ||
    h.get("sec-purpose")?.includes("prefetch") === true ||
    h.get("purpose") === "prefetch" ||
    h.get("x-purpose") === "preview"
  );
}

export async function GET(request: NextRequest) {
  const origin = appOrigin() ?? requestOrigin(request);
  if (isPrefetch(request)) {
    // 204 rather than the redirect: nothing to navigate, nothing cached.
    return new NextResponse(null, { status: 204 });
  }
  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
