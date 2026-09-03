"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LifeBuoy, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/prototype/theme-toggle";
import { Avatar } from "@/components/prototype/avatar";

/**
 * The app's navigation header: add a flight, appearance, help, and the account.
 *
 * These live here rather than in the tab bar because the bar is for the four
 * things a student does every week. A fifth tab would have narrowed all of
 * them to make room for the one nobody opens twice, and the top-right corner
 * is where every native app already puts the account.
 *
 * Start Flight is the exception that earns a permanent icon. It is the entry
 * point to the whole lifecycle -- nothing downstream exists without a flight
 * -- and it is time-critical in a way nothing else here is: a student sitting
 * on the ramp before engine start has seconds of attention, and hunting for
 * it costs the whole track. It sits first because it is the only one of these
 * that is an action rather than a destination.
 *
 * Hidden inside the debrief capture flow, which is deliberately chrome-free.
 *
 * `homeHref` and `actions` are the only two seams: the real Student app needs
 * real action components here (GuideControl, real SupportLink with prefilled
 * account context, UserMenu's account-switching, and a real ThemeToggle --
 * this file's own ThemeToggle persists to a different localStorage key than
 * production's, so it can't be reused as-is without breaking real users'
 * saved preference) that have no prototype equivalent at all. Everything
 * else -- the row layout, the logo treatment, the spacing -- is the same
 * component for both, not a re-derivation. Defaults reproduce the
 * prototype's own original behavior exactly, so its existing call site in
 * app/prototype/layout.tsx needs no change.
 */
export function AppHeader({
  homeHref = "/prototype/vector",
  actions,
}: {
  homeHref?: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/prototype/vector/debrief/new")) return null;

  return (
    <div className="flex items-center gap-0.5 px-4 pb-1 pt-2">
      {/* The lockup already exists in two cuts -- dark ink for paper, white
          for a dark ground. Both render and CSS picks, so the header is
          correct before hydration and when the theme is still the OS's. */}
      <Link href={homeHref} aria-label="AfterFlight home" className="mr-auto flex shrink-0 items-center">
        <Image src="/brand/afterflight-lockup-dark.svg" alt="AfterFlight" width={132} height={21} priority className="dark:hidden" />
        <Image src="/brand/afterflight-lockup-light.svg" alt="AfterFlight" width={132} height={21} priority className="hidden dark:block" />
      </Link>

      {actions ?? <DefaultActions />}
    </div>
  );
}

/** The prototype's own actions -- Start Flight, theme, support, avatar. Unchanged. */
function DefaultActions() {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/prototype/vector/profile");

  return (
    <>
      <Link
        href="/prototype/vector/fly"
        aria-label="Start flight"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
      </Link>
      <ThemeToggle />
      <Link
        href="/prototype/vector/profile/support"
        aria-label="Support"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <LifeBuoy className="size-[22px]" strokeWidth={2} aria-hidden />
      </Link>
      <Link
        href="/prototype/vector/profile"
        aria-label="Profile"
        className={cn("ml-1 rounded-full transition-shadow", onProfile && "ring-2 ring-brand ring-offset-2 ring-offset-surface-sunken")}
      >
        <Avatar size={36} />
      </Link>
    </>
  );
}
