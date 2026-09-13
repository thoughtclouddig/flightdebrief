"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { ClipboardList, Home, PlaneTakeoff, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignThemeSwitch, useDesignTheme } from "@/components/design/design-theme";

/**
 * The mockup's own app frame -- a centered max-width canvas with a fixed
 * bottom tab bar, never a permanent desktop sidebar. Preserves the real
 * Student IA (Home / Train / Debrief / Progress) exactly, because this pass
 * is proposing Train's own card system, not a new navigation model.
 *
 * The canvas widens with the viewport (phone width -> a real desktop
 * measure) rather than either staying phone-width forever or stretching
 * edge to edge -- "polished desktop layout" and "no giant empty areas" are
 * both about the SAME mistake in opposite directions.
 */
export function DesignStudentShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <DesignThemeSwitch />
      <div className="mx-auto min-h-dvh max-w-lg pb-28 md:max-w-3xl xl:max-w-6xl">
        <DesignTopBar />
        <div className="px-4 pb-4 pt-2 md:px-8 xl:px-12">{children}</div>
      </div>
      <DesignBottomNav />
    </div>
  );
}

/**
 * The real lockup, not a placeholder wordmark -- same two SVG cuts
 * components/student/app-header.tsx uses (dark ink for a light ground,
 * white for a dark one). That header picks its cut with a `dark:` utility
 * tied to the document root's own data-theme; this mockup's theme lives on
 * its own .design-canvas subtree instead, so it reads the resolved theme
 * from DesignThemeProvider and swaps the cut directly rather than relying
 * on a variant that wouldn't see this element's local attribute.
 */
function DesignTopBar() {
  const { resolvedTheme } = useDesignTheme();
  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-5 md:px-8 md:pt-8 xl:px-12">
      <Image
        src={resolvedTheme === "dark" ? "/brand/afterflight-lockup-light.svg" : "/brand/afterflight-lockup-dark.svg"}
        alt="AfterFlight"
        width={132}
        height={21}
        priority
      />
      <span className="ml-1 rounded-full border border-[var(--dm-border)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-faint)]">
        Design preview
      </span>
    </div>
  );
}

const TABS = [
  { key: "home", label: "Home", icon: Home },
  { key: "train", label: "Train", icon: PlaneTakeoff },
  { key: "debrief", label: "Debrief", icon: ClipboardList },
  { key: "progress", label: "Progress", icon: TrendingUp },
] as const;

/**
 * Visual only -- there is nothing else under /design/train to navigate to,
 * so these are inert (no onClick, no href), with Train shown active. Same
 * four destinations, same fixed-bottom placement, same tap-target sizing as
 * the real components/student/bottom-nav.tsx, so this reads as the genuine
 * Student shell rather than a mockup-only invention.
 */
function DesignBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--dm-border)] bg-[var(--dm-surface)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch md:max-w-3xl md:justify-center xl:max-w-6xl">
        {TABS.map((t) => {
          const active = t.key === "train";
          const Icon = t.icon;
          return (
            <div
              key={t.key}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight md:w-28 md:flex-none",
                active ? "text-[var(--dm-accent)]" : "text-[var(--dm-text-faint)]",
              )}
            >
              <Icon className="size-[25px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
              {t.label}
            </div>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
