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
 * Milestone 2A: startFlightDisabled exists because this header renders on
 * every /v2 page, including Home in production-adapter (staging) mode --
 * without it, a real signed-in student would reach /v2/fly's fixture-only
 * FlightRecorder from the chrome even though Home's own body correctly
 * disables Start Flight. Same "known gap, shown not hidden" span already
 * used elsewhere (see components/student-nav-v2.tsx's identical pattern).
 * Support and Profile below are NOT gated the same way -- Profile
 * productionization is out of this milestone's scope, flagged as a known
 * follow-up rather than fixed here.
 */
export function V2HeaderActions({ startFlightDisabled = false }: { startFlightDisabled?: boolean }) {
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
      <Link
        href="/v2/profile/support"
        aria-label="Support"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <LifeBuoy className="size-[22px]" strokeWidth={2} aria-hidden />
      </Link>
      <Link
        href="/v2/profile"
        aria-label="Profile"
        className={cn("ml-1 rounded-full transition-shadow", onProfile && "ring-2 ring-brand ring-offset-2 ring-offset-surface-sunken")}
      >
        <Avatar size={36} />
      </Link>
    </>
  );
}
