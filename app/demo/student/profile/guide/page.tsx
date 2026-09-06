import type { Metadata } from "next";
import { GuideScreen } from "@/components/student/profile/guide-screen";
import { ACS_AREAS } from "@/lib/prototype-fixtures/vector-data";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "How AfterFlight works — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Guide -- the same GuideScreen component app/v2/profile/guide/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentGuidePage() {
  return <GuideScreen backHref={HREFS.profile} acsArea={ACS_AREAS.landings} />;
}
