import type { Metadata } from "next";
import { ProfileScreen } from "@/components/student/profile/profile-screen";
import { FLIGHTS } from "@/lib/prototype-fixtures/flights";
import { INSTRUCTOR, STUDENT } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { title: "Profile — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1B fixture-parity Profile -- mechanically the same as app/prototype/vector/profile/page.tsx, hrefs repointed at /v2/**. */
export default function V2ProfilePage() {
  return (
    <ProfileScreen
      certificate={STUDENT.certificate}
      fullName={STUDENT.fullName}
      flightsHref="/v2/flights"
      flightsCount={FLIGHTS.length}
      debriefsHref="/v2/debrief"
      debriefsCount="3"
      instructorHref="/v2/profile"
      instructorName={INSTRUCTOR.fullName}
      guideHref="/v2/profile/guide"
      supportHref="/v2/profile/support"
      dataHandlingHref="/data-handling"
    />
  );
}
