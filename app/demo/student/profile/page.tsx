import type { Metadata } from "next";
import { ProfileScreen } from "@/components/student/profile/profile-screen";
import { FLIGHTS } from "@/lib/prototype-fixtures/flights";
import { INSTRUCTOR, STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "Profile — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Profile -- the same ProfileScreen component and fixture data app/v2/profile/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. No Account section (avatar upload, email change, billing) -- those are real production capabilities with no fixture equivalent, same as app/v2/page.tsx's fixture branch never rendering them either. */
export default function DemoStudentProfilePage() {
  return (
    <ProfileScreen
      certificate={STUDENT.certificate}
      fullName={STUDENT.fullName}
      flightsHref={HREFS.flights}
      flightsCount={FLIGHTS.length}
      debriefsHref={HREFS.debriefHub}
      debriefsCount="3"
      instructorHref={HREFS.profile}
      instructorName={INSTRUCTOR.fullName}
      guideHref={HREFS.profileGuide}
      supportHref={HREFS.profileSupport}
      dataHandlingHref="/data-handling"
    />
  );
}
