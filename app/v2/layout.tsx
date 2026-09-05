import { Suspense, type ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { PrototypeChrome } from "@/components/prototype/prototype-chrome";
import { V2HeaderActions } from "@/app/v2/_components/header-actions";
import { isDevelopment, isProduction, isStaging, v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie, hasValidSiteGateCookie, isSiteGateEnabled } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";

/**
 * Milestone 1A clean-room shell -- structurally identical to
 * app/prototype/layout.tsx (same components, same no-auth/no-repository
 * posture), only the hrefs threaded through differ. Not inside (product):
 * that layout calls getViewer(), and this milestone is explicitly
 * fixture-only, no session, no database.
 *
 * Platform Hardening P0-1: this whole tree is unreleased fixture product,
 * not a robots/noindex hint but a real routing-level guard. Production
 * always 404s, regardless of proxy.ts's matcher (which does not list /v2 at
 * all -- this layout is the one and only guard). Staging reuses the same
 * SITE_ACCESS_CODE gate that already protects /prototype/vector, since that
 * is this repo's existing internal-QA access mechanism; a dedicated staging
 * policy can replace this once a staging deployment actually exists.
 * Development is open, matching every other fixture surface in this repo.
 *
 * Platform Hardening 2B: the fixed STAGING badge below is driven by
 * isStaging() alone, never by hostname -- it renders wherever APP_ENV
 * resolves to staging and cannot render in production, where this whole
 * layout 404s before it would ever reach return().
 *
 * Milestone 2A closeout, superseded by the staging-baseline reversion:
 * staging must first reproduce the complete approved V2 fixture reference
 * experience exactly like development -- PrototypeChrome, full navigation,
 * Mia/Jake -- until v2StagingUsesRealData() is deliberately flipped, matching
 * lib/env.ts's own doc comment. The STAGING badge is unrelated to this and
 * still always shows in staging, real-data mode or not.
 *
 * Development real-data milestone: lib/env.ts's v2RealDataMode() is the one
 * decision point now -- this layout no longer branches on isStaging()/
 * isDevelopment() itself. Real-data mode requires a real session (redirects
 * to /login otherwise, same as app/v2/page.tsx's existing real-data branch)
 * and is Student-only (notFound() for any other role -- CFI/Admin routes are
 * untouched by all of this and were never reachable under /v2 anyway).
 *
 * Staging's real-data mode is still Home-only, exactly as Milestone 2A left
 * it (untouched by this milestone) -- Train/Debrief/Progress stay disabled
 * there. Development's real-data mode is this milestone's full vertical
 * slice: once a screen has a real adapter wired, nothing about it is
 * disabled. `isStagingRealData` is the one flag that keeps those two
 * real-data modes' nav-disabling behavior from colliding.
 */
export default async function V2Layout({ children }: { children: ReactNode }) {
  if (isProduction()) notFound();

  if (isStaging() && isSiteGateEnabled() && !(await hasValidSiteGateCookie())) {
    notFound();
  }

  const realData = v2RealDataMode(await hasV2RealDataCookie());
  const isDevRealData = isDevelopment() && realData;
  const isStagingRealData = isStaging() && realData;

  if (realData) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2&reason=no-session");
    }
    if (viewer.role !== "student") notFound();
  }

  const v2FixtureMode = !realData;
  const disabledNavKeys = isStagingRealData ? (["train", "debrief", "progress"] as const) : [];

  return (
    <div className="min-h-dvh bg-surface-sunken">
      {isStaging() ? (
        <div
          aria-label="Staging environment"
          className="pointer-events-none fixed right-2 top-2 z-40 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-brand shadow-sm"
        >
          Staging
        </div>
      ) : null}
      {isDevRealData ? (
        <div
          aria-label="Real data mode"
          className="pointer-events-none fixed right-2 top-2 z-40 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-brand shadow-sm"
        >
          Real data
        </div>
      ) : null}
      <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
        {v2FixtureMode ? <PrototypeChrome homeHref="/v2" /> : null}
        <Suspense fallback={null}>
          <AppHeader
            homeHref="/v2"
            actions={<V2HeaderActions startFlightDisabled={!v2FixtureMode} profileNavDisabled={isStagingRealData} />}
            hiddenOnPathPrefix="/v2/debrief/new"
          />
        </Suspense>
        {children}
      </div>
      <BottomNav
        hrefs={{ home: "/v2", train: "/v2/train", debrief: "/v2/debrief", progress: "/v2/progress" }}
        disabledKeys={disabledNavKeys}
      />
    </div>
  );
}
