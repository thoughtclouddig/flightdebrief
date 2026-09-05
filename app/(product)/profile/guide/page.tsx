import type { Metadata } from "next";
import { GuideScreen } from "@/components/student/profile/guide-screen";

export const metadata: Metadata = { title: "How AfterFlight works — AfterFlight" };

/**
 * Real Guide -- the same components/student/profile/guide-screen.tsx `/v2`
 * renders. Previously, Profile's "How AfterFlight works" row sent a signed-in
 * student to app/(marketing)/how-it-works, a school-owner sales page written
 * for "the person who has to answer for the decision" -- not a Student
 * screen at all. This route replaces that link, not app/(marketing)/how-it-works
 * itself, which stays as the marketing page it always was.
 *
 * acsArea is a real, generic example ("Takeoffs, Landings, and Go-Arounds"
 * -- see lib/acs.ts's own PRIVATE_ACS_AREAS), not this particular student's
 * data: GuideScreen's score card is illustrative in every caller, fixture or
 * real (score=3/max=4/code="PA.IV.B" are hardcoded inside the component
 * itself, not passed in), so a real, common area name is honest here without
 * needing to be *this* student's own weakest skill.
 */
export default function GuidePage() {
  return <GuideScreen backHref="/profile" acsArea="Takeoffs, Landings, and Go-Arounds" />;
}
