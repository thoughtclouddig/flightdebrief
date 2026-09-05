import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { PrototypeChrome } from "@/components/prototype/prototype-chrome";
import { V2HeaderActions } from "@/app/v2/_components/header-actions";
import { isDevelopment, isProduction, isStaging } from "@/lib/env";
import { hasValidSiteGateCookie, isSiteGateEnabled } from "@/lib/auth/session";

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
 * Milestone 2A closeout: a real staging student must never be able to
 * navigate from Home's real data into fixture content. PrototypeChrome
 * (the "PROTOTYPE / Seeded data" bar and its ?state= switcher) is the
 * fixture-simulation mechanism itself, so it is development-only now --
 * staging's lifecycle must come exclusively from persisted data. BottomNav's
 * Train/Debrief/Progress tabs and the header's Support/Profile icons all
 * still point at Milestone-1B-fixture-only /v2 routes with no real per-user
 * data behind them, so they're disabled in staging the same way Start
 * Flight and Add Flight already are. None of this is productionizing those
 * screens -- it's boundary enforcement so staging can't mix a real student
 * with fixture personas.
 */
export default async function V2Layout({ children }: { children: ReactNode }) {
  if (isProduction()) notFound();

  if (isStaging() && isSiteGateEnabled() && !(await hasValidSiteGateCookie())) {
    notFound();
  }

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
      <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
        {isDevelopment() ? <PrototypeChrome homeHref="/v2" /> : null}
        <Suspense fallback={null}>
          <AppHeader
            homeHref="/v2"
            actions={<V2HeaderActions startFlightDisabled={isStaging()} profileNavDisabled={isStaging()} />}
            hiddenOnPathPrefix="/v2/debrief/new"
          />
        </Suspense>
        {children}
      </div>
      <BottomNav
        hrefs={{ home: "/v2", train: "/v2/train", debrief: "/v2/debrief", progress: "/v2/progress" }}
        disabledKeys={isStaging() ? ["train", "debrief", "progress"] : []}
      />
    </div>
  );
}
