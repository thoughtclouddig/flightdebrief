"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarClock,
  Compass,
  History,
  LayoutDashboard,
  LayoutList,
  Lightbulb,
  PlaneTakeoff,
  Settings,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewerSwitcher } from "@/components/viewer-switcher";
import type { Viewer } from "@/lib/viewer-options";

const STUDENT_ITEMS = [
  { href: "/home", label: "Home", icon: Compass },
  { href: "/dashboard", label: "Flights", icon: LayoutList },
  { href: "/history", label: "Training", icon: History },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: Users },
];

const CFI_ITEMS = [
  { href: "/cfi/today", label: "Today", icon: CalendarClock },
  { href: "/cfi/students", label: "Students", icon: Users },
  { href: "/cfi/flights", label: "Flights", icon: LayoutList },
  { href: "/cfi/training", label: "Training", icon: History },
  { href: "/cfi/profile", label: "Profile", icon: UserCog },
];

const ADMIN_ITEMS = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/insights", label: "Insights", icon: Lightbulb },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/instructors", label: "CFIs", icon: UserCog },
  { href: "/admin/aircraft", label: "Aircraft", icon: PlaneTakeoff },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function itemsForRole(role: Viewer["role"]) {
  if (role === "instructor") return CFI_ITEMS;
  if (role === "admin") return ADMIN_ITEMS;
  return STUDENT_ITEMS;
}

function homeHrefForRole(role: Viewer["role"]) {
  if (role === "instructor") return "/cfi/today";
  if (role === "admin") return "/admin/overview";
  return "/home";
}

function BrandMark() {
  return (
    <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.6px] border-brand">
      <span className="absolute h-[10px] w-[1.6px] rotate-[35deg] bg-brand" />
    </span>
  );
}

function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} className="font-display flex items-center gap-1.5 text-[17px] font-extrabold uppercase tracking-wide text-foreground">
      <BrandMark />
      FlightBrief
    </Link>
  );
}

export function Nav({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const items = itemsForRole(viewer.role);
  const homeHref = homeHrefForRole(viewer.role);

  return (
    <>
      <header className="sticky top-0 z-20 hidden border-b border-hairline bg-surface/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark href={homeHref} />
          <nav className="flex items-center gap-1">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand/10 text-brand-dark dark:bg-brand/20 dark:text-brand-light"
                      : "text-foreground-soft hover:bg-surface-sunken",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ViewerSwitcher viewer={viewer} />
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-hairline bg-surface/90 px-3 backdrop-blur md:hidden">
        <Wordmark href={homeHref} />
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <ViewerSwitcher viewer={viewer} compact />
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-hairline bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-brand-dark dark:text-brand-light" : "text-foreground-faint",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
