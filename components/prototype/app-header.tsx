"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LifeBuoy, Plus } from "lucide-react";
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
 * Add Flight is the exception that earns a permanent icon. It is the entry
 * point to the whole lifecycle -- nothing downstream exists without a flight
 * -- and the alternative is a student who just landed hunting for it. It sits
 * first in the row because it is the only one of these that is an action.
 *
 * Hidden inside the debrief capture flow, which is deliberately chrome-free.
 */
export function AppHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/prototype/vector/debrief/new")) return null;

  const onProfile = pathname.startsWith("/prototype/vector/profile");

  return (
    <div className="flex items-center gap-0.5 px-4 pb-1 pt-2">
      {/* The lockup already exists in two cuts -- dark ink for paper, white
          for a dark ground. Both render and CSS picks, so the header is
          correct before hydration and when the theme is still the OS's. */}
      <Link href="/prototype/vector" aria-label="AfterFlight home" className="mr-auto flex shrink-0 items-center">
        <Image src="/brand/afterflight-lockup-dark.svg" alt="AfterFlight" width={132} height={21} priority className="dark:hidden" />
        <Image src="/brand/afterflight-lockup-light.svg" alt="AfterFlight" width={132} height={21} priority className="hidden dark:block" />
      </Link>

      <Link
        href="/prototype/vector/flights/new"
        aria-label="Add flight"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <Plus className="size-[23px]" strokeWidth={2.2} aria-hidden />
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
    </div>
  );
}
