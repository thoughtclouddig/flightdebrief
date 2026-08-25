import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getRepository } from "@/lib/data";
import { getViewer, listMembershipOptions } from "@/lib/viewer";
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
  return (
    <>
      {viewer.organization.demoExpiresAt ? (
        <LiveDemoBanner expiresAt={viewer.organization.demoExpiresAt} hint={demoHint} />
      ) : null}
      <Nav viewer={viewer} memberships={memberships} guideSteps={guideSteps} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        {children}
      </main>
      {showDemoPanel ? <DemoControlPanel /> : null}
    </>
  );
}
