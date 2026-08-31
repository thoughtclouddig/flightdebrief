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
 */
const TABS = [
  { href: "/prototype/vector", label: "Home", icon: Home },
  { href: "/prototype/vector/train", label: "Train", icon: PlaneTakeoff },
  { href: "/prototype/vector/debrief", label: "Debrief", icon: ClipboardList },
  { href: "/prototype/vector/progress", label: "Progress", icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
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
              {/* Weight carries the active state alongside colour, so the tab
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
