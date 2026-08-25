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
  MoreHorizontal,
  PlaneTakeoff,
  Plus,
  Settings,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { GuideControl } from "@/components/guide/guide-control";
import type { GuideStep } from "@/lib/guide";
import type { MembershipOption, Viewer } from "@/lib/viewer";

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

export function homeHrefForRole(role: Viewer["role"]) {
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
const MAX_VISIBLE_MOBILE_ITEMS = 5;

type NavItem = { href: string; label: string; icon: (typeof STUDENT_ITEMS)[number]["icon"] };

/**
 * Mobile bottom-tab-bar counterpart to NavOverflowMenu -- only kicks in for
 * roles with more items than fit comfortably in the fixed bar (today, just
 * admin's 7). Renders as its own flex-1 tab so it matches its siblings'
 * touch target size, with a full-width panel above the bar rather than a
 * corner dropdown, since a small anchored menu is awkward to reach one-handed
 * at the bottom of a phone screen.
 */
function MobileNavOverflow({ items, active }: { items: NavItem[]; active: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
          active ? "text-brand" : "text-foreground-faint",
        )}
      >
        <MoreHorizontal className="size-5" strokeWidth={active ? 2.5 : 2} />
        More
      </button>

      {open ? (
        <>
          <button
            aria-label="Close"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-xl border border-hairline bg-surface py-1 shadow-lg">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground-soft hover:bg-surface-sunken"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

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

export function Nav({
  viewer,
  memberships,
  guideSteps,
}: {
  viewer: Viewer;
  memberships: MembershipOption[];
  guideSteps: GuideStep[];
}) {
  const pathname = usePathname();
  const items = itemsForRole(viewer.role);
  // In a live demo, the logo goes back to the persona picker (so a visitor
  // can restart or try a different role) instead of their own dashboard --
  // there's nowhere else in-product to do that.
  const homeHref = viewer.organization.demoExpiresAt ? "/demo" : homeHrefForRole(viewer.role);

  const visibleItems = items.length > MAX_VISIBLE_DESKTOP_ITEMS ? items.slice(0, MAX_VISIBLE_DESKTOP_ITEMS - 1) : items;
  const overflowItems = items.length > MAX_VISIBLE_DESKTOP_ITEMS ? items.slice(MAX_VISIBLE_DESKTOP_ITEMS - 1) : [];
  const overflowActive = overflowItems.some((item) => pathname.startsWith(item.href));

  const mobileVisibleItems =
    items.length > MAX_VISIBLE_MOBILE_ITEMS ? items.slice(0, MAX_VISIBLE_MOBILE_ITEMS - 1) : items;
  const mobileOverflowItems =
    items.length > MAX_VISIBLE_MOBILE_ITEMS ? items.slice(MAX_VISIBLE_MOBILE_ITEMS - 1) : [];
  const mobileOverflowActive = mobileOverflowItems.some((item) => pathname.startsWith(item.href));

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
            <GuideControl steps={guideSteps} variant="desktop" />
            <ThemeToggle />
            <UserMenu viewer={viewer} memberships={memberships} />
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-hairline bg-surface/90 px-3 backdrop-blur md:hidden">
        <Wordmark href={homeHref} compact />
        <div className="flex items-center gap-2">
          <GuideControl steps={guideSteps} variant="mobile" />
          <ThemeToggle compact />
          <UserMenu viewer={viewer} memberships={memberships} compact />
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-hairline bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileVisibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-brand" : "text-foreground-faint",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
        {mobileOverflowItems.length > 0 ? (
          <MobileNavOverflow items={mobileOverflowItems} active={mobileOverflowActive} />
        ) : null}

        {viewer.role === "student" ? (
          <Link
            href="/flights/new"
            aria-label="Add a flight"
            className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </Link>
        ) : null}
      </nav>
    </>
  );
}
