import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { cleanupExpiredDemoOrgs, seedCfiSchoolDemo, seedPilotDemo } from "@/lib/demo/live-demo-seed";

const DEMO_ORG_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Public entry point for the marketing site's "try it live" demo -- unlike
 * app/api/auth/dev-login and app/api/demo/enter (both internal-only, gated
 * behind !REPLIT_DEPLOYMENT), this route is meant to run in real production.
 * Provisions a fresh, isolated org+users+data on every visit (see
 * lib/demo/live-demo-seed.ts), mints a real session for the seeded persona,
 * and redirects straight into the product. No rate-limiting/bot-protection
 * in v1 -- the only mitigation is rel="nofollow" on the marketing CTAs; a
 * bot hammering this endpoint would create garbage demo orgs that the lazy
 * cleanup below will still expire and remove on a later visit.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const persona = request.nextUrl.searchParams.get("persona");
  if (persona !== "pilot" && persona !== "cfi" && persona !== "school") {
    return NextResponse.json({ error: "Invalid persona. Use ?persona=pilot|cfi|school." }, { status: 400 });
  }

  try {
    await cleanupExpiredDemoOrgs();

    const expiresAt = new Date(Date.now() + DEMO_ORG_TTL_MS);
    const result = persona === "pilot" ? await seedPilotDemo(expiresAt) : await seedCfiSchoolDemo(persona, expiresAt);

    const jwt = await createSessionJwt({ sub: result.loginEmail, email: result.loginEmail, name: result.loginName });
    const response = NextResponse.redirect(`${origin}${result.redirectPath}`);
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("Live demo provisioning failed:", err);
    return NextResponse.json({ error: "Couldn't start the demo. Please try again." }, { status: 500 });
  }
}
