"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { SupportLink } from "@/components/support-link";
import type { MembershipOption, Viewer } from "@/lib/viewer";

/**
 * The real action row for components/prototype/app-header.tsx's `actions`
 * slot. AppHeader and BottomNav are now literally shared with the prototype
 * (see their own files) -- this row matches the prototype's own DefaultActions
 * slot-for-slot (Start flight, theme, support, account), not a different
 * composition with production's own icon set. Same size-11 circular-target
 * treatment as the prototype's DefaultActions, different real components
 * inside where a real one exists.
 *
 * GuideControl (the onboarding-progress ring) no longer has a header entry
 * point -- there is no fifth slot in the prototype's header to map it onto.
 * It's still rendered on the CFI/admin desktop Nav (see
 * app/(product)/layout.tsx), which this component doesn't touch.
 */
export function StudentHeaderActions({
  viewer,
  memberships,
}: {
  viewer: Viewer;
  memberships: MembershipOption[];
}) {
  return (
    <>
      <Link
        href="/prototype/vector/fly"
        aria-label="Start flight"
        className="flex size-11 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
      >
        <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
      </Link>
      <div className="flex size-11 items-center justify-center">
        <ThemeToggle compact />
      </div>
      <div className="flex size-11 items-center justify-center">
        <SupportLink name={viewer.user.name} email={viewer.user.email} organizationName={viewer.organization.name} role={viewer.role} compact />
      </div>
      <div className="ml-1 flex size-11 items-center justify-center">
        <UserMenu viewer={viewer} memberships={memberships} compact />
      </div>
    </>
  );
}
