import { after, NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, V2_REAL_DATA_COOKIE } from "@/lib/auth/session";
import { cleanupExpiredDemoOrgs, seedCfiV2Demo, seedPilotDemo, seedSchoolV2Demo } from "@/lib/demo/live-demo-seed";
import { DEMO_HINT_COOKIE } from "@/lib/demo/live-demo-jobs";
import { isDevelopment } from "@/lib/env";

/** The curated Student product demo -- see app/demo/student/layout.tsx. */
const STUDENT_DEMO_PATH = "/demo/student";

const DEMO_ORG_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Next.js caches GET route handlers by default unless they read a dynamic
// API (cookies()/headers()) or explicitly opt out -- reading
// request.nextUrl.searchParams does NOT count as an opt-out. Without this,
// the very first response (say, for ?persona=cfi) can get served back for
// every later request regardless of query string, including different
// personas -- exactly the "clicked Pilot, landed on the CFI account" bug.
export const dynamic = "force-dynamic";

/**
 * Public entry point for the marketing site's "try it live" demo -- unlike
 * app/api/auth/dev-login and app/api/demo/enter (both internal-only, gated
 * behind !REPLIT_DEPLOYMENT), this route is meant to run in real production.
 * Provisions a fresh, isolated org+users+data on every visit (see
 * lib/demo/live-demo-seed.ts), mints a real session for the seeded persona,
 * and redirects straight into the product. The seed writes are deliberately
 * batched so this reliable request-bound flow does not depend on an in-memory
 * background job surviving across autoscaled instances.
 *
 * The pilot persona is the curated Student product demo -- Mia, not a real
 * account. It makes zero database writes: no org, no user, no session, no
 * cookie, just a deterministic redirect to /demo/student, identical in
 * Development, Staging, and Production. This used to seed a real ephemeral
 * Jordan org and mint a real session before landing on /home (or, briefly,
 * real-data /v2 in development) -- that entire path is gone for this
 * persona now that the curated demo doesn't need a database at all.
 *
 * pilot-real is the separate, Development-only real-data QA entry (invalid
 * persona outside development) that still does what pilot used to: seeds a
 * real Jordan org, mints a real session, enables real-data /v2. Backend/
 * lifecycle QA only, never the curated demo -- Mia (fixture) and Jordan
 * (real-data QA) are deliberately not the same persona and must not be
 * conflated.
 *
 * cfi and school now call the two explicit V2 roster seeds
 * (seedCfiV2Demo/seedSchoolV2Demo) instead of one seedCfiSchoolDemo(persona)
 * that conflated them into a single, identical, single-instructor org --
 * see lib/demo/live-demo-seed.ts's own doc comments for the composition.
 *
 * cfi-v2 is a Development-only alias for persona=cfi -- same seedCfiV2Demo
 * call and the same real CFI session, kept only because it's already the
 * URL used in prior review notes. In Development, persona=cfi itself now
 * redirects to /cfi-v2 too (see redirectPath below): Development is where
 * the new tree gets reviewed against the real 10/2/2 roster, so there is no
 * canonical /cfi/today left to preserve there. Staging and Production are
 * unaffected -- persona=cfi still resolves to canonical /cfi/today, since
 * isDevelopment() is false in both. Mirrors pilot-real's Development-only
 * gating, and disappears once CFI V2 is ready to cut over.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const persona = request.nextUrl.searchParams.get("persona");

  if (persona === "pilot") {
    return NextResponse.redirect(`${origin}${STUDENT_DEMO_PATH}`);
  }

  if (persona !== "pilot-real" && persona !== "cfi" && persona !== "cfi-v2" && persona !== "school") {
    return NextResponse.json({ error: "Invalid persona. Use ?persona=pilot|cfi|school." }, { status: 400 });
  }
  if ((persona === "pilot-real" || persona === "cfi-v2") && !isDevelopment()) {
    return NextResponse.json({ error: "Invalid persona. Use ?persona=pilot|cfi|school." }, { status: 400 });
  }

  try {
    after(async () => {
      try {
        await cleanupExpiredDemoOrgs();
      } catch (err) {
        console.error("Expired demo cleanup failed:", err);
      }
    });

    const expiresAt = new Date(Date.now() + DEMO_ORG_TTL_MS);
    const result =
      persona === "pilot-real"
        ? await seedPilotDemo(expiresAt)
        : persona === "cfi" || persona === "cfi-v2"
          ? await seedCfiV2Demo(expiresAt)
          : await seedSchoolV2Demo(expiresAt);

    const jwt = await createSessionJwt({ sub: result.loginEmail, email: result.loginEmail, name: result.loginName });
    // pilot-real is the only persona that enables real-data /v2 (validated
    // Development-only above) -- backend/lifecycle QA, not the product demo.
    const v2RealData = persona === "pilot-real";
    const cfiV2Preview = persona === "cfi-v2" || (persona === "cfi" && isDevelopment());
    const redirectPath = cfiV2Preview ? "/cfi-v2" : v2RealData ? "/v2" : result.redirectPath;
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.set(DEMO_HINT_COOKIE, result.hint, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: DEMO_ORG_TTL_MS / 1000,
    });
    if (v2RealData) {
      response.cookies.set(V2_REAL_DATA_COOKIE, "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (err) {
    console.error("Live demo provisioning failed:", err);
    return NextResponse.json({ error: "Couldn't start the demo. Please try again." }, { status: 500 });
  }
}
