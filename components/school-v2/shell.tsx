"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Gauge, LineChart, Plane, Settings, ShieldCheck, UserCog, Users } from "lucide-react";
import { ThemeToggle } from "@/components/prototype/theme-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/school-v2", label: "Overview", icon: Gauge },
  { href: "/school-v2/students", label: "Students", icon: Users },
  { href: "/school-v2/instructors", label: "Instructors", icon: UserCog },
  { href: "/school-v2/insights", label: "Insights", icon: LineChart },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/school-v2/aircraft", label: "Aircraft", icon: Plane },
  { href: "/school-v2/settings", label: "Settings", icon: Settings },
  { href: "/school-v2/data", label: "Data & consent", icon: ShieldCheck },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/school-v2") return pathname === "/school-v2";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * School V2's desktop-first application shell -- a persistent sidebar, not
 * the mobile bottom-tab pattern Student V2 and CFI V2 use. School is
 * desk-oriented: reviewing a whole roster from a laptop, not glancing
 * between lessons on a phone. Below `md` the sidebar collapses into a
 * horizontal icon strip rather than a bottom tab bar -- a bottom tab bar
 * would visually claim School V2 is the same kind of app as Student/CFI V2,
 * which the product brief explicitly says it isn't.
 *
 * Aircraft/Settings/Data & consent are deliberately visually subordinate
 * (smaller text, no active-pill background, muted color) to Overview/
 * Students/Instructors/Insights -- the brief's "do not make Aircraft
 * visually equal to training intelligence."
 */
export function SchoolV2Shell({
  organizationName,
  viewerName,
  children,
}: {
  organizationName: string;
  viewerName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-sunken text-foreground md:flex-row">
      <aside className="hidden shrink-0 flex-col border-r border-hairline bg-surface md:flex md:w-60">
        <div className="flex flex-col gap-0.5 px-5 pb-4 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">School V2 preview</p>
          <p className="truncate text-[16px] font-semibold text-foreground">{organizationName}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                isActivePath(pathname, href)
                  ? "bg-brand/15 text-brand"
                  : "text-foreground-soft hover:bg-surface-sunken hover:text-foreground",
              )}
            >
              <Icon className="size-[17px] shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mx-3 my-2 border-t border-hairline" />

        <nav className="flex flex-col gap-0.5 px-3 pb-4">
          {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActivePath(pathname, href) ? "text-brand" : "text-foreground-faint hover:text-foreground-soft",
              )}
            >
              <Icon className="size-[15px] shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-between border-t border-hairline px-5 py-3">
          <p className="truncate text-[13px] text-foreground-faint">{viewerName}</p>
          <ThemeToggle />
        </div>
      </aside>

      <nav className="flex items-center gap-1 overflow-x-auto border-b border-hairline bg-surface px-3 py-2 md:hidden">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium",
              isActivePath(pathname, href) ? "bg-brand/15 text-brand" : "text-foreground-soft",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
        <Link
          href="/school-v2/settings"
          className={cn(
            "ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium",
            isActivePath(pathname, "/school-v2/settings") ? "text-brand" : "text-foreground-faint",
          )}
        >
          <Settings className="size-4 shrink-0" aria-hidden />
        </Link>
      </nav>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
