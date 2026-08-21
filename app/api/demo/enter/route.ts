import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { resolveUserOnLogin } from "@/lib/auth/store";
import { ensureVideoDemoSeeded } from "@/lib/demo/video-demo-seed";
import { DEMO_INSTRUCTOR_EMAIL, DEMO_STUDENT_EMAIL } from "@/lib/demo/video-demo-data";

export const DEMO_MODE_COOKIE = "fb_demo_mode";

/**
 * Video Demo Mode's session-minting entry point -- same pattern as
 * app/api/auth/dev-login/route.ts (mint a real session JWT for an
 * already-seeded email, no password/magic-link required), plus: ensures the
 * demo dataset exists (idempotent) and sets a marker cookie so
 * components/demo/demo-control-panel.tsx renders. Hard-gated identically to
 * dev-login -- 404s inside a real Replit deployment, never reachable there.
 *
 * ?as=student|instructor picks which of the two demo personas to become
 * (guided-mode debrief cards can only be operated by an instructor/admin
 * viewer -- see app/(product)/flights/[id]/debrief/page.tsx -- so scenes 2-6
 * are recorded as the instructor, scenes 1/7/8 as the student).
 * ?next=<path> controls where the session lands; defaults to /home.
 */
export async function GET(request: NextRequest) {
  if (process.env.REPLIT_DEPLOYMENT) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const origin = requestOrigin(request);
  const as = request.nextUrl.searchParams.get("as") === "instructor" ? "instructor" : "student";
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const email = as === "instructor" ? DEMO_INSTRUCTOR_EMAIL : DEMO_STUDENT_EMAIL;

  try {
    await ensureVideoDemoSeeded();

    const user = await resolveUserOnLogin({ sub: email, email, name: null });
    if (!user) {
      return NextResponse.json({ error: "Demo user could not be resolved." }, { status: 500 });
    }

    const jwt = await createSessionJwt({ sub: email, email, name: user.name });
    const response = NextResponse.redirect(`${origin}${next}`);
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.set(DEMO_MODE_COOKIE, "1", {
      httpOnly: false, // read by nothing server-critical; just lets the control panel confirm state client-side too
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("[demo] enter failed:", err);
    return NextResponse.json({ error: "Failed to enter demo mode." }, { status: 500 });
  }
}

function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}
