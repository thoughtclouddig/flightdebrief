import { Suspense, type ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/student/app-header";
import { CfiV2BottomNav } from "@/components/cfi-v2/bottom-nav";
import { CfiV2HeaderActions } from "@/components/cfi-v2/header-actions";
import { getViewer } from "@/lib/viewer";

/**
 * CFI V2's clean-room shell -- the approved, released CFI experience,
 * deliberately its own layout rather than nested under app/v2 (Student's
 * fixture/real-data shell). Nesting there would pull in Student-specific
 * bottom navigation, v2RealDataMode()'s cookie-gated fixture/real-data
 * branch, and PrototypeChrome, none of which apply to a CFI session -- CFI
 * V2 has no fixture mode at all; it always runs on a real, authenticated
 * instructor session, same as canonical /cfi/**, just under a different
 * route tree and presentation.
 *
 * Real-data only, released in every environment: unlike Student's /v2
 * (which needs a fixture mode for the public curated demo), a CFI has no
 * public demo persona -- ?persona=cfi already seeds a real org and mints a
 * real session (see app/api/demo/start/route.ts). This layout only needs a
 * signed-in instructor -- no environment gate; role/ownership checks below
 * are the only thing standing between a viewer and this route, same as
 * every other released surface in this repo. Canonical /cfi/** is
 * completely untouched by any of this.
 */
export default async function CfiV2Layout({ children }: { children: ReactNode }) {
  let viewer;
  try {
    viewer = await getViewer();
  } catch {
    redirect("/login?from=%2Fcfi-v2&reason=no-session");
  }
  if (viewer.role !== "instructor") notFound();

  return (
    <div className="min-h-dvh bg-surface-sunken">
      <div
        aria-label="CFI V2 preview"
        className="pointer-events-none fixed right-2 top-2 z-40 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-brand shadow-sm"
      >
        CFI V2
      </div>
      <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
        <Suspense fallback={null}>
          <AppHeader homeHref="/cfi-v2" actions={<CfiV2HeaderActions />} hiddenOnPathPrefix="/cfi-v2/__none__" />
        </Suspense>
        {children}
      </div>
      <CfiV2BottomNav />
    </div>
  );
}
