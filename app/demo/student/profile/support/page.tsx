import type { Metadata } from "next";
import { SupportScreen } from "@/components/student/profile/support-screen";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "Support — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Support -- the same SupportScreen component app/v2/profile/support/page.tsx renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentSupportPage() {
  return <SupportScreen backHref={HREFS.profile} guideHref={HREFS.profileGuide} trainHref={HREFS.train} />;
}
