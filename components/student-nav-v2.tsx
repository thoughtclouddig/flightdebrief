"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, PlaneTakeoff, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { GuideControl } from "@/components/guide/guide-control";
import { SupportLink } from "@/components/support-link";
import type { GuideStep } from "@/lib/guide";
import type { MembershipOption, Viewer } from "@/lib/viewer";

/**
 * The Student V2 nav shell. Two pieces, matching components/prototype/
 * app-header.tsx and bottom-nav.tsx exactly rather than approximating them:
 *
 * StudentHeader -- plain, NOT sticky, NOT bordered, NOT backdrop-blurred.
 * The first version of this had a sticky/border/backdrop-blur desktop bar
 * constrained to max-w-6xl -- exactly the "desktopified into a SaaS
 * dashboard" mistake the visual-parity pass exists to catch. AppHeader has
 * none of that: one row (`flex items-center gap-0.5 px-4 pb-1 pt-2`), no
 * viewport split, same narrow column at every width. This now matches that
 * -- the narrow-column constraint lives in app/(product)/layout.tsx's
 * student branch, wrapping header AND content the same way
 * app/prototype/layout.tsx wraps AppHeader and children.
 *
 * The specific icons differ from AppHeader's (Start Flight/Theme/Support/
 * Avatar) because the real capabilities differ: GuideControl and UserMenu's
 * account-switching have no prototype equivalent at all, and "Start Flight"
 * (a live-recording session) has no backing endpoint -- see train/page.tsx's
 * and home/page.tsx's own notes on that gap. Same icon COUNT and the same
 * plain, circular-target treatment; different real actions behind them.
 *
 * StudentBottomNav -- unchanged from the prior pass, already verified
 * against bottom-nav.tsx.
 */
const STUDENT_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/train", label: "Train", icon: PlaneTakeoff },
  { href: "/debrief", label: "Debrief", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: TrendingUp },
] as const;

export function StudentNavV2({
  viewer,
  memberships,
  guideSteps,
}: {
  viewer: Viewer;
  memberships: MembershipOption[];
  guideSteps: GuideStep[];
}) {
  // Same live-demo exit affordance as Nav -- the logo returns to the
  // persona picker instead of Home, since that's the only in-product way
  // back to the marketing site for a visitor who isn't a real account yet.
  const homeHref = viewer.organization.demoExpiresAt ? "/demo" : "/home";

  return (
    <div className="flex items-center gap-0.5 px-4 pb-1 pt-2">
      <Link href={homeHref} aria-label="AfterFlight home" className="mr-auto flex shrink-0 items-center">
        <Image src="/brand/afterflight-lockup-dark.svg" alt="AfterFlight" width={132} height={21} priority className="dark:hidden" />
        <Image
          src="/brand/afterflight-lockup-light.svg"
          alt="AfterFlight"
          width={132}
          height={21}
          priority
          className="hidden dark:block"
        />
      </Link>

      <div className="flex size-11 items-center justify-center">
        <GuideControl steps={guideSteps} variant="mobile" />
      </div>
      <div className="flex size-11 items-center justify-center">
        <SupportLink name={viewer.user.name} email={viewer.user.email} organizationName={viewer.organization.name} role={viewer.role} compact />
      </div>
      <div className="flex size-11 items-center justify-center">
        <ThemeToggle compact />
      </div>
      <div className="ml-1 flex size-11 items-center justify-center">
        <UserMenu viewer={viewer} memberships={memberships} compact />
      </div>
    </div>
  );
}

export function StudentBottomNav() {
  const pathname = usePathname();
  return (
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
    </nav>
  );
}
