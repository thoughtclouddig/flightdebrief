import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { StudentNavV2 } from "@/components/student-nav-v2";
import { getRepository } from "@/lib/data";
import { getViewer, listMembershipOptions } from "@/lib/viewer";
import { isSuperadmin } from "@/lib/superadmin";
import { isMembershipSwitcherEnabled } from "@/lib/auth/membership-switcher";
import { computeGuideSteps } from "@/lib/guide";
import { DemoControlPanel } from "@/components/demo/demo-control-panel";
import { DEMO_MODE_COOKIE } from "@/app/api/demo/enter/route";
import { DEMO_HINT_COOKIE } from "@/lib/demo/live-demo-jobs";
import { LiveDemoBanner } from "@/components/demo/live-demo-banner";

export default async function ProductLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.user.profileCompleted) redirect("/onboarding");
  const [memberships, guideSteps] = await Promise.all([
    isMembershipSwitcherEnabled() ? listMembershipOptions(viewer.user.id) : Promise.resolve([]),
    computeGuideSteps(getRepository(), viewer),
  ]);
  const cookieStore = await cookies();
  // Never rendered inside a real deployment, only when a demo session
  // actually set the marker cookie (see app/api/demo/enter/route.ts), and
  // never for a live-demo org (viewer.organization.demoExpiresAt) -- a stale
  // fb_demo_mode cookie from earlier Video Demo Mode testing must never
  // surface this internal scene-list tool inside the public live demo.
  const showDemoPanel =
    !process.env.REPLIT_DEPLOYMENT && !viewer.organization.demoExpiresAt && cookieStore.get(DEMO_MODE_COOKIE)?.value === "1";
  const demoHint = cookieStore.get(DEMO_HINT_COOKIE)?.value ?? null;

  // Phase 4: students get the V2 shell (StudentNavV2 + the V2 pages' own
  // Screen component, which already supplies its own px-4/pb gutters --
  // stacking main's old max-w-6xl px-4 wrapper on top of that would double
  // the horizontal padding every V2 page already renders). Instructor/admin
  // get the exact unchanged path below; nothing in this branch touches
  // components/nav.tsx or its behavior for them.
  if (viewer.role === "student") {
    return (
      <>
        {viewer.organization.demoExpiresAt ? (
          <LiveDemoBanner expiresAt={viewer.organization.demoExpiresAt} hint={demoHint} />
        ) : null}
        <StudentNavV2 viewer={viewer} memberships={memberships} guideSteps={guideSteps} />
        <main className="mx-auto w-full max-w-lg flex-1 pb-24 pt-2">{children}</main>
        {showDemoPanel ? <DemoControlPanel /> : null}
      </>
    );
  }

  return (
    <>
      {viewer.organization.demoExpiresAt ? (
        <LiveDemoBanner expiresAt={viewer.organization.demoExpiresAt} hint={demoHint} />
      ) : null}
      <Nav viewer={viewer} memberships={memberships} guideSteps={guideSteps} isSuperadmin={isSuperadmin(viewer.user.email)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        {children}
      </main>
      {showDemoPanel ? <DemoControlPanel /> : null}
    </>
  );
}
