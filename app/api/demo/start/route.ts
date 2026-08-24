import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { cleanupExpiredDemoOrgs, seedCfiSchoolDemo, seedPilotDemo } from "@/lib/demo/live-demo-seed";
import { createDemoJob, failDemoJob, resolveDemoJob } from "@/lib/demo/live-demo-jobs";

const DEMO_ORG_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Next.js caches GET route handlers by default unless they read a dynamic
// API (cookies()/headers()) or explicitly opt out -- reading
// request.nextUrl.searchParams does NOT count as an opt-out. Without this,
// the very first response (say, for ?persona=cfi) can get served back for
// every later request regardless of query string, including different
// personas -- exactly the "clicked Pilot, landed on the CFI account" bug.
export const dynamic = "force-dynamic";

/** Carries the persona-specific onboarding line (see LiveDemoResult.hint) to app/(product)/layout.tsx, which renders it in LiveDemoBanner. */
export const DEMO_HINT_COOKIE = "fb_demo_hint";

/**
 * Public entry point for the marketing site's "try it live" demo -- unlike
 * app/api/auth/dev-login and app/api/demo/enter (both internal-only, gated
 * behind !REPLIT_DEPLOYMENT), this route is meant to run in real production.
 *
 * Deliberately does NOT await seeding before responding. The full seed
 * (org/users/aircraft, several students' worth of historical flights, each
 * one a sequential round trip against a remote Postgres, plus a throttled
 * batch of post-commit training-item/signal/milestone writes -- see
 * lib/demo/live-demo-seed.ts) genuinely takes several seconds, and making
 * the visitor's browser sit on a blank tab for all of it read as "broken" in
 * testing. Instead this kicks the seed off in the background (the Node
 * process stays alive after the response is sent, same as this file's
 * existing fire-and-forget TTS pre-warm) and immediately redirects to a
 * loading page that polls app/api/demo/status/route.ts until it's ready.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const persona = request.nextUrl.searchParams.get("persona");
  if (persona !== "pilot" && persona !== "cfi" && persona !== "school") {
    return NextResponse.json({ error: "Invalid persona. Use ?persona=pilot|cfi|school." }, { status: 400 });
  }

  const token = randomUUID();
  createDemoJob(token);

  void (async () => {
    try {
      await cleanupExpiredDemoOrgs();
      const expiresAt = new Date(Date.now() + DEMO_ORG_TTL_MS);
      const result = persona === "pilot" ? await seedPilotDemo(expiresAt) : await seedCfiSchoolDemo(persona, expiresAt);
      resolveDemoJob(token, result);
    } catch (err) {
      console.error("Live demo provisioning failed:", err);
      failDemoJob(token, "Couldn't start the demo. Please try again.");
    }
  })();

  return NextResponse.redirect(`${origin}/demo/preparing?token=${token}&persona=${persona}`);
}
