import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import {
  createSessionJwt,
  verifyMagicLinkJwt,
  verifySignupLinkJwt,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { resolveUserOnLogin, resolveSignupOnLogin } from "@/lib/auth/store";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";
import type { User } from "@/lib/types";

/**
 * Email link sign-in, step 2 -- handles both purposes minted in step 1:
 * a plain magic-link (resolveUserOnLogin keeps the owner-bootstrap /
 * invite-linking / invite-only logic unchanged) or a self-serve signup-link
 * (resolveSignupOnLogin, /api/auth/signup). The normalized email is the
 * stable identity anchor (users.auth_user_id) either way.
 */
export async function GET(request: NextRequest) {
  // Prefer the server-configured origin; forwarded headers are attacker-
  // influenceable and must not decide where we redirect after auth.
  const origin = appOrigin() ?? requestOrigin(request);
  const token = request.nextUrl.searchParams.get("token");

  // The session cookie is set on whichever host serves THIS request, so the
  // callback must run on the host the user will actually browse. When the
  // link went out pointing somewhere else -- APP_BASE_URL unset, so
  // appOrigin() fell back to the *.replit.app deployment domain -- signing in
  // minted a perfectly valid cookie on a host the user never visits again,
  // and every protected page on the real domain then redirected to /login
  // looking like a broken session. Bounce to the canonical origin first,
  // carrying the token, so the cookie always lands where it is read.
  const arrivedOn = requestOrigin(request);
  const canonical = appOrigin();
  if (token && canonical && arrivedOn !== canonical) {
    const canonicalCallback = new URL("/api/auth/callback", canonical);
    canonicalCallback.searchParams.set("token", token);
    return NextResponse.redirect(canonicalCallback.toString());
  }
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  const magicLinkEmail = await verifyMagicLinkJwt(token);
  const signupClaims = magicLinkEmail ? null : await verifySignupLinkJwt(token);
  if (!magicLinkEmail && !signupClaims) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  try {
    let user: User | null;
    let email: string;

    if (magicLinkEmail) {
      email = magicLinkEmail;
      user = await resolveUserOnLogin({ sub: email, email, name: null });
      if (!user) {
        return NextResponse.redirect(`${origin}/login?error=not-invited`);
      }
    } else {
      email = signupClaims!.email;
      const result = await resolveSignupOnLogin(email, signupClaims!.name, signupClaims!.orgName, signupClaims!.orgKind);
      user = result.user;
      if (result.newOrganizationId && signupClaims!.orgKind === "independent_cfi") {
        // Keeps the lightweight `instructors` table (used by Flight.instructorId)
        // in sync, same convention app/api/admin/invite-cfi/route.ts already uses.
        // School signers aren't necessarily CFIs themselves, so this is skipped
        // for that kind -- they invite their own CFIs afterward.
        await getRepository().getOrCreateInstructor(user.name, result.newOrganizationId);
      }
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
    console.error("Auth callback failed:", err);
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }
}
