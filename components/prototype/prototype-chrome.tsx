"use client";

import { Suspense } from "react";
import { Eye, X } from "lucide-react";
import { DemoStateSwitch } from "@/components/prototype/demo-state-switch";
import { useStored } from "@/lib/prototype/use-stored";

/**
 * The prototype's own scaffolding: the "seeded data" badge and the Home-state
 * switch.
 *
 * Collapsible, because it sits exactly where a real app's status bar and
 * navigation header would be, and you cannot judge the header's proportions
 * with a review banner stacked on top of it. Hidden it leaves a small handle
 * rather than nothing, so the way back is discoverable.
 *
 * The choice persists, so a reviewer who hides it once is not fighting it on
 * every navigation.
 */
export function PrototypeChrome({ homeHref = "/prototype/vector" }: { homeHref?: string }) {
  const [stored, setStored] = useStored("af-prototype-chrome");
  const hidden = stored === "hidden";

  function set(next: boolean) {
    setStored(next ? "hidden" : "shown");
  }

  if (hidden) {
    return (
      <button
        onClick={() => set(false)}
        aria-label="Show prototype controls"
        className="fixed left-2 top-2 z-30 flex size-7 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-foreground-faint backdrop-blur transition-colors hover:bg-foreground/20"
      >
        <Eye className="size-3.5" aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-5 pt-3">
      <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
        Prototype
      </span>
      <p className="text-[11px] text-foreground-faint">Seeded data</p>
      <span className="flex-1" />
      <Suspense fallback={null}>
        <DemoStateSwitch homeHref={homeHref} />
      </Suspense>
      <button
        onClick={() => set(true)}
        aria-label="Hide prototype controls"
        className="-mr-1 flex size-7 cursor-pointer items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
