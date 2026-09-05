"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/prototype/theme-toggle";
import { Avatar } from "@/components/prototype/avatar";

/**
 * Milestone 1B header actions -- same row, same icons, same layout as the
 * prototype's own DefaultActions (components/student/app-header.tsx), with
 * every destination now real under /v2 (Start Flight, Support, Profile all
 * exist as of Milestone 1B), so nothing here is disabled anymore -- see
 * Milestone 1A's version of this file for the interim state.
 *
 * Milestone 2A: startFlightDisabled and profileNavDisabled exist because
 * this header renders on every /v2 page, including Home in production-
 * adapter (staging) mode -- without them, a real signed-in staging student
 * could reach /v2/fly's or /v2/profile's fixture-only content directly from
 * the chrome even though Home's own body is correctly real-data-only. Same
 * "known gap, shown not hidden" span already used elsewhere (see
 * components/student-nav-v2.tsx's identical Start Flight pattern). Not
 * productionizing Profile/Support here -- boundary enforcement only.
 */
export function V2HeaderActions({
  startFlightDisabled = false,
  profileNavDisabled = false,
}: {
  startFlightDisabled?: boolean;
  profileNavDisabled?: boolean;
}) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/v2/profile");

  return (
    <>
      {startFlightDisabled ? (
        <span
          aria-label="Start flight"
          aria-disabled="true"
          className="flex size-11 cursor-not-allowed items-center justify-center rounded-full text-foreground-faint opacity-40"
        >
          <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
        </span>
      ) : (
        <Link
          href="/v2/fly"
          aria-label="Start flight"
          className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
        >
          <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
        </Link>
      )}
      <ThemeToggle />
      {profileNavDisabled ? (
        <span
          aria-label="Support"
          aria-disabled="true"
          className="flex size-11 cursor-not-allowed items-center justify-center rounded-full text-foreground-faint opacity-40"
        >
          <LifeBuoy className="size-[22px]" strokeWidth={2} aria-hidden />
        </span>
      ) : (
        <Link
          href="/v2/profile/support"
          aria-label="Support"
          className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
        >
          <LifeBuoy className="size-[22px]" strokeWidth={2} aria-hidden />
        </Link>
      )}
      {profileNavDisabled ? (
        <span aria-label="Profile" aria-disabled="true" className="ml-1 cursor-not-allowed rounded-full opacity-40">
          <Avatar size={36} />
        </span>
      ) : (
        <Link
          href="/v2/profile"
          aria-label="Profile"
          className={cn("ml-1 rounded-full transition-shadow", onProfile && "ring-2 ring-brand ring-offset-2 ring-offset-surface-sunken")}
        >
          <Avatar size={36} />
        </Link>
      )}
    </>
  );
}
