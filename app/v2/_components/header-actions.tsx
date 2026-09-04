"use client";

import { LifeBuoy, Plane } from "lucide-react";
import { ThemeToggle } from "@/components/prototype/theme-toggle";
import { Avatar } from "@/components/prototype/avatar";

/**
 * Milestone 1A's header actions -- same row, same icons, same layout as the
 * prototype's own DefaultActions (components/student/app-header.tsx), so the
 * six acceptance-test pairs stay pixel-comparable. Start Flight, Support, and
 * Profile are disabled rather than either linking into /prototype/vector/**
 * or pointing at a /v2 route that doesn't exist in this milestone (/v2/fly,
 * /v2/profile/support, /v2/profile are all Flights/Profile extraction work,
 * explicitly out of scope) -- an explicit known-state marker, per the
 * milestone's route-isolation rule. ThemeToggle has no destination at all, so
 * it stays fully live.
 */
export function V2HeaderActions() {
  return (
    <>
      <span
        aria-label="Start flight"
        aria-disabled="true"
        className="flex size-11 cursor-not-allowed items-center justify-center rounded-full text-foreground-faint opacity-40"
      >
        <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
      </span>
      <ThemeToggle />
      <span
        aria-label="Support"
        aria-disabled="true"
        className="flex size-11 cursor-not-allowed items-center justify-center rounded-full text-foreground-faint opacity-40"
      >
        <LifeBuoy className="size-[22px]" strokeWidth={2} aria-hidden />
      </span>
      <span aria-label="Profile" aria-disabled="true" className="ml-1 cursor-not-allowed rounded-full opacity-40">
        <Avatar size={36} />
      </span>
    </>
  );
}
