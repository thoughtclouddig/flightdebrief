"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, ClipboardList, TrendingUp } from "lucide-react";
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
  { href: "/prototype/vector/train", label: "Train", icon: Dumbbell },
  { href: "/prototype/vector/debrief", label: "Debrief", icon: ClipboardList },
  { href: "/prototype/vector/progress", label: "Progress", icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/95 backdrop-blur">
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
                "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                active ? "text-brand" : "text-foreground-faint hover:text-foreground-soft",
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.25]")} />
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
