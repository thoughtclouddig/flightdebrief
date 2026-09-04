"use client";

import { Plane } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { SupportLink } from "@/components/support-link";
import type { MembershipOption, Viewer } from "@/lib/viewer";

/**
 * The real action row for components/student/app-header.tsx's `actions`
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
 *
 * Start Flight is disabled here (Platform Hardening P0-3): it's live
 * in-flight recording (components/prototype/flight-recorder.tsx), which has
 * no production API that accepts a completed session -- see the doc comment
 * on app/(product)/flights/new/student-new-flight-client.tsx. Linking it to
 * /prototype/vector/fly put real students on unreleased fixture product;
 * pointing it at /flights/new instead would silently swap live recording for
 * a different feature (retrospective search/manual entry). Disabled is the
 * honest state until a production recording endpoint exists -- same
 * span/aria-disabled/opacity-40 treatment this exact icon used in Milestone
 * 1A before /v2/fly existed (see git history of app/v2/_components/header-actions.tsx).
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
      <span
        aria-label="Start flight"
        aria-disabled="true"
        className="flex size-11 cursor-not-allowed items-center justify-center rounded-full text-foreground-faint opacity-40"
      >
        <Plane className="size-[23px]" strokeWidth={2.2} aria-hidden />
      </span>
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
