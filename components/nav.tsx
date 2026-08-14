"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarClock,
  ChevronDown,
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
import { UserMenu } from "@/components/user-menu";
import type { Viewer } from "@/lib/viewer";

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

function Wordmark({ href, compact = false }: { href: string; compact?: boolean }) {
  const height = compact ? 22 : 26;
  const width = Math.round(height * (484.41 / 77.27));
  return (
    <Link href={href} className="flex shrink-0 items-center">
      <Image
        src="/brand/afterflight-lockup-dark.svg"
        alt="AfterFlight"
        width={width}
        height={height}
        priority
        className="dark:hidden"
      />
      <Image
        src="/brand/afterflight-lockup-light.svg"
        alt="AfterFlight"
        width={width}
        height={height}
        priority
        className="hidden dark:block"
      />
    </Link>
  );
}

const MAX_VISIBLE_DESKTOP_ITEMS = 5;

function NavOverflowMenu({
  items,
  active,
}: {
  items: { href: string; label: string }[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-brand/10 text-brand-dark dark:bg-brand/20 dark:text-brand-light"
            : "text-foreground-soft hover:bg-surface-sunken",
        )}
      >
        More
        <ChevronDown className="size-3.5" />
      </button>

      {open ? (
        <>
          <button aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-hairline bg-surface py-1 shadow-lg">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-foreground-soft hover:bg-surface-sunken"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function Nav({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const items = itemsForRole(viewer.role);
  const homeHref = homeHrefForRole(viewer.role);

  const visibleItems = items.length > MAX_VISIBLE_DESKTOP_ITEMS ? items.slice(0, MAX_VISIBLE_DESKTOP_ITEMS - 1) : items;
  const overflowItems = items.length > MAX_VISIBLE_DESKTOP_ITEMS ? items.slice(MAX_VISIBLE_DESKTOP_ITEMS - 1) : [];
  const overflowActive = overflowItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <header className="sticky top-0 z-20 hidden border-b border-hairline bg-surface/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <Wordmark href={homeHref} />
          <nav className="flex min-w-0 items-center gap-0.5">
            {visibleItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand/10 text-brand-dark dark:bg-brand/20 dark:text-brand-light"
                      : "text-foreground-soft hover:bg-surface-sunken",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {overflowItems.length > 0 ? <NavOverflowMenu items={overflowItems} active={overflowActive} /> : null}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <UserMenu viewer={viewer} />
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-hairline bg-surface/90 px-3 backdrop-blur md:hidden">
        <Wordmark href={homeHref} compact />
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <UserMenu viewer={viewer} compact />
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
