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
 */
export function V2HeaderActions() {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/v2/profile");

  return (
    <>
      <Link
        href="/v2/fly"
        aria-label="Start flight"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
      </Link>
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
