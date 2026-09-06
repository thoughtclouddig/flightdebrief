"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardList, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CFI V2's own four destinations -- Today, Students, Debrief, Profile.
 *
 * Deliberately not components/student/bottom-nav.tsx: that component's tab
 * identities (Home/Train/Debrief/Progress, with production hrefs like
 * /home, /train) are Student-specific, and CFI's four destinations are a
 * different concept, not a relabeling of the same four. See the CLEAN-ROOM
 * STRATEGY note on app/cfi-v2/layout.tsx.
 */
const TABS = [
  { key: "today", label: "Today", href: "/cfi-v2", icon: CalendarClock },
  { key: "students", label: "Students", href: "/cfi-v2/students", icon: Users },
  { key: "debrief", label: "Debrief", href: "/cfi-v2/debrief", icon: ClipboardList },
  { key: "profile", label: "Profile", href: "/cfi-v2/profile", icon: User },
] as const;

export function CfiV2BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((t) => {
          // Exact match for Today (its href is a prefix of Students' and
          // every nested student-detail route), startsWith for the rest.
          const active = t.key === "today" ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex min-h-[56px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight transition-colors",
                active ? "text-brand" : "text-foreground-soft",
              )}
            >
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
