import type { LiveDemoResult } from "./live-demo-seed";

/**
 * In-memory tracker for in-flight demo provisioning, keyed by a one-time
 * token -- same "process-lifetime only, doesn't survive a cold start or
 * scale-out" tradeoff as lib/audio-cache.ts, which is the existing precedent
 * for this kind of ephemeral state in this app. Exists so
 * app/api/demo/start/route.ts can redirect the visitor to a loading page
 * immediately instead of making their browser sit on a blank tab for the
 * whole multi-second seeding chain (org/users/aircraft/several students'
 * worth of historical flights, all sequential inserts against a remote
 * Postgres) -- see app/(marketing)/demo/preparing/page.tsx, which polls
 * app/api/demo/status/route.ts until this resolves.
 */
export type DemoJob =
  | { status: "pending" }
  | { status: "ready"; result: LiveDemoResult }
  | { status: "error"; message: string };

/** Carries the persona-specific onboarding line (see LiveDemoResult.hint) to app/(product)/layout.tsx, which renders it in LiveDemoBanner. Lives here (rather than on the start or status route) since both routes need it. */
export const DEMO_HINT_COOKIE = "fb_demo_hint";

const jobs = new Map<string, DemoJob>();

/** Bounds worst-case memory if a visitor abandons the tab before polling ever claims the result. */
const JOB_TTL_MS = 5 * 60 * 1000;

export function createDemoJob(token: string): void {
  jobs.set(token, { status: "pending" });
  setTimeout(() => jobs.delete(token), JOB_TTL_MS);
}

export function resolveDemoJob(token: string, result: LiveDemoResult): void {
  jobs.set(token, { status: "ready", result });
}

export function failDemoJob(token: string, message: string): void {
  jobs.set(token, { status: "error", message });
}

export function getDemoJob(token: string): DemoJob | undefined {
  return jobs.get(token);
}

/** Called once the client has actually claimed a ready result (see status route) -- no reason to keep it around waiting out the full TTL. */
export function clearDemoJob(token: string): void {
  jobs.delete(token);
}
