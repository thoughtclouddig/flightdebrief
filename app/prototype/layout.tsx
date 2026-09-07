import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { PrototypeChrome } from "@/components/prototype/prototype-chrome";
import { isDevelopment } from "@/lib/env";

/**
 * Standalone shell for the prototype.
 *
 * Deliberately NOT inside the (product) route group: that layout calls
 * getViewer() and getDb(), and a prototype whose purpose is being evaluable in
 * five minutes cannot need an account and a database first. It reads no
 * session and touches no repository.
 *
 * max-w-lg with persistent bottom navigation, because this is a phone product
 * and judging it in a desktop-width column would flatter it dishonestly.
 *
 * Staging-RC-0: this is the one guard for the entire /prototype/** family
 * (~19 routes, all under this layout, nothing sits outside it). Development-
 * only, full stop -- unlike /v2's layout, this does NOT fall back to the
 * SITE_ACCESS_CODE gate in staging, because the whole point of this guard is
 * that prototype UI must not depend on an operational password secret to stay
 * unavailable outside development. proxy.ts still lists /prototype among the
 * optional marketing-gate prefixes; that is unchanged and now redundant for
 * correctness, not relied on.
 */
export default function PrototypeLayout({ children }: { children: ReactNode }) {
  if (!isDevelopment()) notFound();

  return (
    <div className="min-h-dvh bg-surface-sunken">
      <div className="mx-auto min-h-dvh max-w-lg bg-surface-sunken pb-24">
        <PrototypeChrome />
        <Suspense fallback={null}>
          <AppHeader />
        </Suspense>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
