import { Suspense, type ReactNode } from "react";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { V2HeaderActions } from "@/app/v2/_components/header-actions";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

/**
 * The public, curated Student product demo -- the approved Mia /v2 fixture
 * experience, reachable with no session and no database, under its own
 * namespace so nothing here can ever escape into /v2, /home, or any
 * authenticated canonical Student route.
 *
 * Deliberately reuses the same components app/v2/layout.tsx does
 * (AppHeader, BottomNav, V2HeaderActions) with hrefs built from
 * buildFixtureStudentHrefs("/demo/student") instead of /v2's own hrefs --
 * same shell, different namespace, not a recreation. No PrototypeChrome
 * (reviewer-only scaffolding, not part of the product), no Staging/Real-data
 * badges (this tree has no real-data mode to badge), no isProduction()/
 * isStaging() branching at all -- this route is public in every environment
 * by design (see proxy.ts's MARKETING_PREFIXES, which already covers /demo),
 * not gated the way /v2 is.
 */
export default function DemoStudentLayout({ children }: { children: ReactNode }) {
  const hrefs = buildFixtureStudentHrefs("/demo/student");

  return (
    <div className="min-h-dvh bg-surface-sunken">
      <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
        <Suspense fallback={null}>
          <AppHeader
            homeHref={hrefs.home}
            actions={<V2HeaderActions flyHref={hrefs.fly} profileHref={hrefs.profile} supportHref={hrefs.profileSupport} />}
            hiddenOnPathPrefix={hrefs.debriefNew}
          />
        </Suspense>
        {children}
      </div>
      <BottomNav hrefs={{ home: hrefs.home, train: hrefs.train, debrief: hrefs.debriefHub, progress: hrefs.progress }} />
    </div>
  );
}
