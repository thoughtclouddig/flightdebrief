import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { PrototypeChrome } from "@/components/prototype/prototype-chrome";
import { V2HeaderActions } from "@/app/v2/_components/header-actions";
import { isProduction, isStaging } from "@/lib/env";
import { isSiteGateEnabled, SITE_GATE_COOKIE, verifySiteGateJwt } from "@/lib/auth/session";

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
 */
export default async function V2Layout({ children }: { children: ReactNode }) {
  if (isProduction()) notFound();

  if (isStaging() && isSiteGateEnabled()) {
    const cookieStore = await cookies();
    const gateToken = cookieStore.get(SITE_GATE_COOKIE)?.value;
    const passed = gateToken ? await verifySiteGateJwt(gateToken) : false;
    if (!passed) notFound();
  }

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
