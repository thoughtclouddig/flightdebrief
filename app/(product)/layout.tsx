import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { StudentWalkthrough } from "@/components/student-walkthrough";
import { getViewer, listMembershipOptions } from "@/lib/viewer";
import { isMembershipSwitcherEnabled } from "@/lib/auth/membership-switcher";
import { DemoControlPanel } from "@/components/demo/demo-control-panel";
import { DEMO_MODE_COOKIE } from "@/app/api/demo/enter/route";
import { LiveDemoBanner } from "@/components/demo/live-demo-banner";

export default async function ProductLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.user.profileCompleted) redirect("/onboarding");
  const memberships = isMembershipSwitcherEnabled() ? await listMembershipOptions(viewer.user.id) : [];
  // Never rendered inside a real deployment, and only when a demo session
  // actually set the marker cookie -- see app/api/demo/enter/route.ts.
  const showDemoPanel = !process.env.REPLIT_DEPLOYMENT && (await cookies()).get(DEMO_MODE_COOKIE)?.value === "1";
  return (
    <>
      {viewer.organization.demoExpiresAt ? <LiveDemoBanner expiresAt={viewer.organization.demoExpiresAt} /> : null}
      <Nav viewer={viewer} memberships={memberships} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        {children}
      </main>
      {viewer.role === "student" ? <StudentWalkthrough userId={viewer.user.id} /> : null}
      {showDemoPanel ? <DemoControlPanel /> : null}
    </>
  );
}
