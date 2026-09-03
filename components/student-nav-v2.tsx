"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, PlaneTakeoff, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { GuideControl } from "@/components/guide/guide-control";
import { SupportLink } from "@/components/support-link";
import type { GuideStep } from "@/lib/guide";
import type { MembershipOption, Viewer } from "@/lib/viewer";

/**
 * The Student V2 nav shell -- Phase 4. A separate component from
 * components/nav.tsx rather than a branch inside it: the visual language
 * (text-color active state, no border indicator, V2 tab sizing) is different
 * enough from Nav's that sharing render code risked the one thing this phase
 * is explicit about -- CFI and admin must see byte-for-byte the same Nav they
 * see today. Nothing here is imported by, or changes the behavior of,
 * components/nav.tsx.
 *
 * Four destinations, matching components/prototype/bottom-nav.tsx's IA
 * exactly: Home | Train | Debrief | Progress. My Flights, Flight Detail and
 * Fly are reached BY NAVIGATING from those four, not as their own tabs --
 * the prototype's own nav has only four tabs, and Profile is reached from
 * the avatar menu (UserMenu below), not a fifth tab, for the same reason
 * app/prototype/vector/profile/page.tsx gives: a destination visited once a
 * month doesn't narrow the bar everyone uses every day.
 */
const STUDENT_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/train", label: "Train", icon: PlaneTakeoff },
  { href: "/debrief", label: "Debrief", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: TrendingUp },
] as const;

function Wordmark({ href, compact = false }: { href: string; compact?: boolean }) {
  const height = compact ? 22 : 26;
  const width = Math.round(height * (484.41 / 77.27));
  return (
    <Link href={href} className="flex shrink-0 items-center">
      <Image src="/brand/afterflight-lockup-dark.svg" alt="AfterFlight" width={width} height={height} priority className="dark:hidden" />
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

export function StudentNavV2({
  viewer,
  memberships,
  guideSteps,
}: {
  viewer: Viewer;
  memberships: MembershipOption[];
  guideSteps: GuideStep[];
}) {
  const pathname = usePathname();
  // Same live-demo exit affordance as Nav -- the logo returns to the
  // persona picker instead of Home, since that's the only in-product way
  // back to the marketing site for a visitor who isn't a real account yet.
  const homeHref = viewer.organization.demoExpiresAt ? "/demo" : "/home";

  return (
    <>
      <header className="sticky top-0 z-20 hidden border-b border-hairline bg-surface/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <Wordmark href={homeHref} />
          <nav className="flex min-w-0 items-center gap-1">
            {STUDENT_TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
                    active ? "text-brand" : "text-foreground-soft hover:bg-surface-sunken hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <GuideControl steps={guideSteps} variant="desktop" />
            <SupportLink name={viewer.user.name} email={viewer.user.email} organizationName={viewer.organization.name} role={viewer.role} />
            <ThemeToggle />
            <UserMenu viewer={viewer} memberships={memberships} />
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-hairline bg-surface/90 px-3 backdrop-blur md:hidden">
        <Wordmark href={homeHref} compact />
        <div className="flex items-center gap-2">
          <GuideControl steps={guideSteps} variant="mobile" />
          <SupportLink
            name={viewer.user.name}
            email={viewer.user.email}
            organizationName={viewer.organization.name}
            role={viewer.role}
            compact
          />
          <ThemeToggle compact />
          <UserMenu viewer={viewer} memberships={memberships} compact />
        </div>
      </header>

      {/*
       * Bottom tab bar, V2 treatment: text/icon color carries the active
       * state (no top border), matching components/prototype/bottom-nav.tsx
       * exactly rather than Nav's border-indicator language. Visible on all
       * widths, not just mobile -- the prototype's own layout never had a
       * desktop-specific nav at all (see app/prototype/layout.tsx's own
       * comment on judging a phone product at phone width), so this is the
       * one true student destination bar; the desktop header row above is
       * secondary/reachable-either-way, matching how a phone app with a
       * bottom bar sometimes offers the same items in a top shelf too.
       */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lg items-stretch">
          {STUDENT_TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-[56px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight transition-colors",
                  active ? "text-brand" : "text-foreground-soft",
                )}
              >
                <Icon className="size-[25px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Same floating add-flight action Nav gives students today --
            unchanged behavior, repositioned onto the V2 bar. */}
        <Link
          href="/flights/new"
          aria-label="Add a flight"
          className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-on-brand shadow-lg shadow-brand/30 transition-transform active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.5} aria-hidden />
        </Link>
      </nav>
    </>
  );
}
