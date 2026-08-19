import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, verifyEmailChangeJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { getUserByEmail, listMembershipsForUser, updateUserEmail } from "@/lib/auth/store";
import { getDb } from "@/lib/db";
import { appOrigin } from "@/lib/email";

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
/** Each role has its own profile/settings route (not a shared page), so send them back to the one they actually use. */
async function profilePathFor(userId: string): Promise<string> {
  const memberships = await listMembershipsForUser(userId);
  const active = memberships.find((m) => m.status === "active");
  if (active?.role === "instructor") return "/cfi/profile";
  if (active?.role === "admin") return "/admin/settings";
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
    const destination = await profilePathFor(claims.userId);

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
