import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { resolveUserOnLogin } from "@/lib/auth/store";

/**
 * Dev-only shortcut that mints a real session for an already-invited/seeded
 * email without sending or clicking a magic link -- same session-creation
 * path app/api/auth/callback/route.ts uses after verifying a token, just
 * skipping the "wait for an email" step. Only ever reachable outside a real
 * Replit deployment (same guard as lib/data/postgres-repository.ts's
 * shouldSeedDemoData), and only for emails resolveUserOnLogin already
 * recognizes -- it can't create new accounts, so it's not an auth bypass for
 * arbitrary emails, just a faster path through auth that already works.
 *
 * Deliberately uses requestOrigin() (this request's actual host), NOT
 * lib/email.ts's appOrigin() -- that helper is pinned to APP_BASE_URL (the
 * stable production domain, so emailed links never point somewhere that
 * disappears) which would silently bounce this same-request redirect over to
 * production even when testing from the dev workspace, landing on a session
 * cookie set for the wrong domain.
 */
export async function GET(request: NextRequest) {
  if (process.env.REPLIT_DEPLOYMENT) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const origin = requestOrigin(request);
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.redirect(`${origin}/dev/login?error=missing-email`);
  }

  try {
    const user = await resolveUserOnLogin({ sub: email, email, name: null });
    if (!user) {
      return NextResponse.redirect(`${origin}/dev/login?error=not-invited`);
    }

    const jwt = await createSessionJwt({ sub: email, email, name: user.name });
    const destination = user.profileCompleted ? "/app" : "/onboarding";
    const response = NextResponse.redirect(`${origin}${destination}`);
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("Dev login failed:", err);
    return NextResponse.redirect(`${origin}/dev/login?error=auth-failed`);
  }
}
