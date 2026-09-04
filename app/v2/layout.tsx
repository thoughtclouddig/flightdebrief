import { Suspense, type ReactNode } from "react";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { PrototypeChrome } from "@/components/prototype/prototype-chrome";
import { V2HeaderActions } from "@/app/v2/_components/header-actions";

/**
 * Milestone 1A clean-room shell -- structurally identical to
 * app/prototype/layout.tsx (same components, same no-auth/no-repository
 * posture), only the hrefs threaded through differ. Not inside (product):
 * that layout calls getViewer(), and this milestone is explicitly
 * fixture-only, no session, no database.
 */
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-sunken">
      <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
        <PrototypeChrome homeHref="/v2" />
        <Suspense fallback={null}>
          <AppHeader homeHref="/v2" actions={<V2HeaderActions />} hiddenOnPathPrefix="/v2/debrief/new" />
        </Suspense>
        {children}
      </div>
      <BottomNav hrefs={{ home: "/v2", train: "/v2/train", debrief: "/v2/debrief", progress: "/v2/progress" }} />
    </div>
  );
}
