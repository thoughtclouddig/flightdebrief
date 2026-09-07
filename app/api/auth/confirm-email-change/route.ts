import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import {
  createSessionJwt,
  verifyEmailChangeJwt,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type EmailChangeReturnContext,
} from "@/lib/auth/session";
import { getUserByEmail, listMembershipsForUser, updateUserEmail } from "@/lib/auth/store";
import { getDb } from "@/lib/db";
import { appOrigin } from "@/lib/email";
import { isDevelopment } from "@/lib/env";

/**
 * Email-change, step 2: verifies the token clicked from the NEW inbox
 * (proof of ownership, same trust model as the magic-link callback), then
 * flips both users.email and users.auth_user_id together -- see
 * lib/auth/store.ts's updateUserEmail for why those must move as a pair.
 * No pre-existing session required to click this, same as the login
 * callback: the token itself is the authorization. Re-issues a session
 * cookie for the browser that clicked it so that tab doesn't need to log in
 * again; other already-open sessions for this user will simply need to
 * sign back in with the new email next time they load a page.
 */
/**
 * Each role has its own profile/settings route (not a shared page), so send
 * them back to the one they actually use. returnContext narrows an admin's
 * destination further -- School V2's Settings is a Development-only
 * presentation of the same admin capability, not a different role, so an
 * admin who started the change there should land back there instead of
 * canonical /admin/settings. The role itself is re-verified fresh from the
 * database here regardless of what the token claims, so a forged or stale
 * returnContext can only ever redirect within a destination this user's
 * ACTUAL current role already has -- never to a page they couldn't
 * otherwise reach.
 */
async function profilePathFor(userId: string, returnContext?: EmailChangeReturnContext): Promise<string> {
  const memberships = await listMembershipsForUser(userId);
  const active = memberships.find((m) => m.status === "active");
  if (active?.role === "instructor") return "/cfi/profile";
  if (active?.role === "admin") {
    if (returnContext === "school-v2-settings" && isDevelopment()) return "/school-v2/settings";
    return "/admin/settings";
  }
  return "/profile";
}

export async function GET(request: NextRequest) {
  const origin = appOrigin() ?? requestOrigin(request);
  const token = request.nextUrl.searchParams.get("token");
  const claims = token ? await verifyEmailChangeJwt(token) : null;
  if (!claims) {
    return NextResponse.redirect(`${origin}/profile?error=email-change-expired`);
  }

  try {
    const destination = await profilePathFor(claims.userId, claims.returnContext);

    // Re-check for a collision at confirm time too -- the window between
    // request and click is when a race against another account claiming the
    // same address would land.
    const existing = await getUserByEmail(claims.newEmail);
    if (existing && existing.id !== claims.userId) {
      return NextResponse.redirect(`${origin}${destination}?error=email-change-taken`);
    }

    const { rows } = await getDb().query("SELECT id, name FROM users WHERE id = $1", [claims.userId]);
    const user = rows[0];
    if (!user) {
      return NextResponse.redirect(`${origin}${destination}?error=email-change-expired`);
    }

    await updateUserEmail(claims.userId, claims.newEmail);

    const jwt = await createSessionJwt({ sub: claims.newEmail, email: claims.newEmail, name: user.name });
    const response = NextResponse.redirect(`${origin}${destination}?email-updated=1`);
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("Email-change confirmation failed:", err);
    return NextResponse.redirect(`${origin}/profile?error=email-change-failed`);
  }
}
