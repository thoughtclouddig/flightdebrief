"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDENT } from "@/lib/prototype/vector-data";

/**
 * Profile and support, parked in a header rather than the tab bar.
 *
 * The bottom bar is for the four things a student does; account and help are
 * things they need occasionally and want to find in the same place every
 * time. Putting them in the top-right corner is the native convention, and it
 * keeps the tab bar at four -- a fifth tab would have made Progress narrower
 * to make room for something nobody opens twice a week.
 *
 * Hidden inside the debrief capture flow, which is deliberately chrome-free.
 */
export function AppHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/prototype/vector/debrief/new")) return null;

  const onProfile = pathname.startsWith("/prototype/vector/profile");
  const initials = STUDENT.fullName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex items-center justify-end gap-1 px-5 pt-3">
      <Link
        href="/prototype/vector/profile/support"
        aria-label="Support"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <LifeBuoy className="size-[22px]" strokeWidth={1.8} aria-hidden />
      </Link>
      <Link
        href="/prototype/vector/profile"
        aria-label="Profile"
        className={cn(
          "flex size-10 items-center justify-center rounded-full text-[15px] font-semibold transition-colors",
          onProfile ? "bg-brand text-on-brand" : "bg-surface-sunken text-foreground-soft",
        )}
      >
        {initials}
      </Link>
    </div>
  );
}
