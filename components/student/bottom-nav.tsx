"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlaneTakeoff, ClipboardList, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Four destinations. Not seven.
 *
 * Persistent navigation is what stops each screen having to carry every CTA
 * it might ever need -- if TRAIN is always one tap away, HOME does not need
 * to offer training, quizzing and chair-flying inline. That is most of what
 * made the first prototype feel like a long page rather than an app.
 *
 * `hrefs` is the one thing that differs between the prototype's own route
 * and the real Student app -- everything else (this component) is literally
 * shared, not re-derived. The prototype's four destinations nest under one
 * prefix (/prototype/vector, /prototype/vector/train, ...); production's are
 * flat siblings (/home, /train, ...), so this takes an explicit href per
 * tab rather than a single prefix that can't express both shapes. Defaults
 * reproduce the prototype's own original hrefs exactly, so its existing
 * call site in app/prototype/layout.tsx needs no change.
 */
const TAB_DEFS = [
  { key: "home", label: "Home", icon: Home },
  { key: "train", label: "Train", icon: PlaneTakeoff },
  { key: "debrief", label: "Debrief", icon: ClipboardList },
  { key: "progress", label: "Progress", icon: TrendingUp },
] as const;

const DEFAULT_HREFS = {
  home: "/prototype/vector",
  train: "/prototype/vector/train",
  debrief: "/prototype/vector/debrief",
  progress: "/prototype/vector/progress",
};

/**
 * disabledKeys: Milestone 2A -- staging's /v2 Home is real data, but Train/
 * Debrief/Progress are still Milestone 1B fixture routes there (no per-user
 * real data behind them yet). Rather than navigate a real staging student
 * into fixture content, the caller marks those tabs disabled -- same
 * "known gap, shown not hidden" span treatment as everywhere else in /v2's
 * production-adapter mode. Empty by default, so every existing caller
 * (prototype, production, dev-mode /v2) is unaffected.
 */
export function BottomNav({
  hrefs = DEFAULT_HREFS,
  disabledKeys = [],
}: {
  hrefs?: Record<"home" | "train" | "debrief" | "progress", string>;
  disabledKeys?: readonly ("home" | "train" | "debrief" | "progress")[];
}) {
  const pathname = usePathname();
  const tabs = TAB_DEFS.map((t) => ({ ...t, href: hrefs[t.key], disabled: disabledKeys.includes(t.key) }));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch">
        {tabs.map((t) => {
          // Exact match for Home (its own href is a prefix of every other
          // tab's -- both the prototype's "/prototype/vector" and
          // production's "/home" have this property relative to their
          // siblings), startsWith for the rest so a nested route like
          // /progress/[skill] still lights up Progress.
          const active = t.key === "home" ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          if (t.disabled) {
            return (
              <span
                key={t.href}
                aria-disabled="true"
                className="flex min-h-[56px] flex-1 cursor-not-allowed flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight text-foreground-soft opacity-40"
              >
                <Icon className="size-[25px]" strokeWidth={2} aria-hidden />
                {t.label}
              </span>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              /* 56px tall: a real tap target, not a link. */
              className={cn(
                "flex min-h-[56px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight transition-colors",
                active ? "text-brand" : "text-foreground-soft",
              )}
            >
              {/* Weight carries the active state alongside color, so the tab
                  bar still reads for anyone who can't separate the two hues.
                  1.7 was hairline-thin at this size and made every icon look
                  provisional. */}
              <Icon className="size-[25px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
