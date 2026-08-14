import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, verifyMagicLinkJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { resolveUserOnLogin } from "@/lib/auth/store";
import { appOrigin } from "@/lib/email";

/**
 * Email magic-link sign-in, step 2: verify the emailed token and establish
 * the app session. The normalized email is the stable identity anchor
 * (users.auth_user_id) -- resolveUserOnLogin keeps the owner-bootstrap /
 * invite-linking / invite-only logic unchanged.
 */
export async function GET(request: NextRequest) {
  // Prefer the server-configured origin; forwarded headers are attacker-
  // influenceable and must not decide where we redirect after auth.
  const origin = appOrigin() ?? requestOrigin(request);
  const token = request.nextUrl.searchParams.get("token");

  const email = token ? await verifyMagicLinkJwt(token) : null;
  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  try {
    const user = await resolveUserOnLogin({ sub: email, email, name: null });
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=not-invited`);
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
    console.error("Magic-link callback failed:", err);
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }
}
