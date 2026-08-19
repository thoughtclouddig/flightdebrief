import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getViewer, listMembershipOptions } from "@/lib/viewer";
import { isMembershipSwitcherEnabled } from "@/lib/auth/membership-switcher";

export default async function ProductLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.user.profileCompleted) redirect("/onboarding");
  const memberships = isMembershipSwitcherEnabled() ? await listMembershipOptions(viewer.user.id) : [];
  return (
    <>
      <Nav viewer={viewer} memberships={memberships} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        {children}
      </main>
    </>
  );
}
