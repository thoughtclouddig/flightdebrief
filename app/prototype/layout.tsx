import type { ReactNode } from "react";
import { BottomNav } from "@/components/prototype/bottom-nav";

/**
 * Standalone shell for the prototype.
 *
 * Deliberately NOT inside the (product) route group: that layout requires a
 * session and a database, and a prototype whose purpose is being evaluable in
 * five minutes cannot need an account first. It reads no session and touches
 * no repository.
 *
 * max-w-lg with persistent bottom navigation, because this is a phone product
 * and judging it in a desktop-width column would flatter it dishonestly.
 */
export default function PrototypeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-sunken">
      <div className="mx-auto min-h-dvh max-w-lg bg-surface pb-24">
        <div className="flex items-center gap-2 px-5 pt-3">
          <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
            Prototype
          </span>
          <p className="text-[11px] text-foreground-faint">Seeded data</p>
        </div>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
