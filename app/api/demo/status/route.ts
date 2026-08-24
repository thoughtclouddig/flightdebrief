import { NextResponse, type NextRequest } from "next/server";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { DEMO_HINT_COOKIE, clearDemoJob, getDemoJob } from "@/lib/demo/live-demo-jobs";

const DEMO_ORG_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours -- must match app/api/demo/start/route.ts

export const dynamic = "force-dynamic";

/**
 * Polled by app/(marketing)/demo/preparing/page.tsx while a demo org seeds
 * in the background (kicked off by app/api/demo/start/route.ts). Session
 * cookies are set HERE rather than by /api/demo/start, since that route
 * returns before seeding -- and before the login user it needs even exists.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const job = getDemoJob(token);
  if (!job) return NextResponse.json({ status: "error", message: "This demo link expired. Start a new one." });
  if (job.status !== "ready") return NextResponse.json(job);

  const { result } = job;
  const jwt = await createSessionJwt({ sub: result.loginEmail, email: result.loginEmail, name: result.loginName });
  const response = NextResponse.json({ status: "ready", redirectPath: result.redirectPath });
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
  clearDemoJob(token);
  return response;
}
