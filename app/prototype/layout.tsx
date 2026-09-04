import { Suspense, type ReactNode } from "react";
import { BottomNav } from "@/components/student/bottom-nav";
import { AppHeader } from "@/components/student/app-header";
import { PrototypeChrome } from "@/components/prototype/prototype-chrome";

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
 */
export default function PrototypeLayout({ children }: { children: ReactNode }) {
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
