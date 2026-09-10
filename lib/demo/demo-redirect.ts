export type DemoPersona = "pilot-real" | "cfi" | "cfi-v2" | "school";

/**
 * Pure redirect-path decision for app/api/demo/start/route.ts, extracted so
 * the per-persona branching can be unit-tested without a NextRequest or a
 * live database -- the route handler still owns seeding and session/cookie
 * mechanics, this only decides where to send the browser afterward.
 *
 * cfi-v2 is a legacy alias for persona=cfi (same seed, same session), kept
 * only because it's already the URL used in prior review notes -- both
 * resolve to /cfi-v2 in every environment, the approved, released CFI
 * experience (app/cfi-v2/layout.tsx gates on a real instructor session
 * only, not environment). persona=school resolves to /school-v2 the same
 * way in every environment -- School V2 passed the same release review.
 * pilot-real is the only persona that enables real-data /v2, and remains
 * Development-only (validated by the route handler before this function is
 * ever called).
 */
export function resolveDemoRedirectPath(opts: { persona: DemoPersona; seedRedirectPath: string }): string {
  if (opts.persona === "cfi-v2" || opts.persona === "cfi") return "/cfi-v2";
  if (opts.persona === "school") return "/school-v2";

  const v2RealData = opts.persona === "pilot-real";
  if (v2RealData) return "/v2";

  return opts.seedRedirectPath;
}
