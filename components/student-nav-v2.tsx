"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { GuideControl } from "@/components/guide/guide-control";
import { SupportLink } from "@/components/support-link";
import type { GuideStep } from "@/lib/guide";
import type { MembershipOption, Viewer } from "@/lib/viewer";

/**
 * The real action row for components/prototype/app-header.tsx's `actions`
 * slot. AppHeader and BottomNav are now literally shared with the prototype
 * (see their own files) -- this is the one piece that can't be, because
 * GuideControl, real account-context SupportLink, and UserMenu's
 * account-switching have no prototype equivalent, and the prototype's own
 * ThemeToggle persists to a different localStorage key than production's
 * real one. Same size-11 circular-target treatment as the prototype's
 * DefaultActions, different real components inside.
 */
export function StudentHeaderActions({
  viewer,
  memberships,
  guideSteps,
}: {
  viewer: Viewer;
  memberships: MembershipOption[];
  guideSteps: GuideStep[];
}) {
  return (
    <>
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
    </>
  );
}
