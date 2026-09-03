import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { StudentHeaderActions } from "@/components/student-nav-v2";
import { AppHeader } from "@/components/prototype/app-header";
import { BottomNav } from "@/components/prototype/bottom-nav";
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

  // Students get the actual prototype shell -- components/prototype/
  // app-header.tsx and bottom-nav.tsx, the same files app/prototype/layout.tsx
  // renders, not a recreation of them. Nested exactly the way that layout
  // nests AppHeader/children/BottomNav: one max-w-lg column carrying the
  // header AND the content (so the header never stretches wider than the
  // content below it), with the bottom nav as a sibling outside it. The V2
  // pages' own Screen component already supplies px-4/pb gutters, so this
  // wrapper adds none of its own. Instructor/admin get the exact unchanged
  // path below; nothing in this branch touches components/nav.tsx or its
  // behavior for them.
  if (viewer.role === "student") {
    // Same live-demo exit affordance the old StudentNavV2 had -- the logo
    // returns to the persona picker instead of Home, since that's the only
    // in-product way back to the marketing site for a visitor who isn't a
    // real account yet.
    const homeHref = viewer.organization.demoExpiresAt ? "/demo" : "/home";
    return (
      <div className="min-h-dvh bg-surface-sunken">
        <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
          {viewer.organization.demoExpiresAt ? (
            <LiveDemoBanner expiresAt={viewer.organization.demoExpiresAt} hint={demoHint} />
          ) : null}
          <AppHeader
            homeHref={homeHref}
            actions={<StudentHeaderActions viewer={viewer} memberships={memberships} guideSteps={guideSteps} />}
          />
          {children}
        </div>
        <BottomNav hrefs={{ home: "/home", train: "/train", debrief: "/debrief", progress: "/progress" }} />
        {showDemoPanel ? <DemoControlPanel /> : null}
      </div>
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
