export type DemoPersona = "pilot-real" | "cfi" | "cfi-v2" | "school";

/**
 * Pure redirect-path decision for app/api/demo/start/route.ts, extracted so
 * the per-persona/per-environment branching can be unit-tested without a
 * NextRequest or a live database -- the route handler still owns seeding
 * and session/cookie mechanics, this only decides where to send the
 * browser afterward.
 *
 * cfi-v2 is a Development-only alias for persona=cfi (same seed, same
 * session); in Development, persona=cfi itself also resolves to /cfi-v2
 * (see app/cfi-v2/layout.tsx's own Development-only + role gate). persona=
 * school mirrors that exact pattern for /school-v2 -- Development-only,
 * same seedSchoolV2Demo call, same Taylor Admin session. Staging and
 * Production are unaffected by either: isDevelopment() is false in both,
 * so cfi/school both fall through to the seed's own canonical
 * redirectPath (/cfi/today, /admin/overview). pilot-real is the only
 * persona that enables real-data /v2 (validated Development-only by the
 * route handler before this function is ever called).
 */
export function resolveDemoRedirectPath(opts: {
  persona: DemoPersona;
  isDev: boolean;
  seedRedirectPath: string;
}): string {
  const cfiV2Preview = opts.persona === "cfi-v2" || (opts.persona === "cfi" && opts.isDev);
  if (cfiV2Preview) return "/cfi-v2";

  const schoolV2Preview = opts.persona === "school" && opts.isDev;
  if (schoolV2Preview) return "/school-v2";

  const v2RealData = opts.persona === "pilot-real";
  if (v2RealData) return "/v2";

  return opts.seedRedirectPath;
}
