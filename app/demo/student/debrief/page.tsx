import type { Metadata } from "next";
import { StudentDebriefHub, type StudentDebriefRow } from "@/components/student/debrief/student-debrief-hub";
import { DEBRIEFS } from "@/lib/prototype-fixtures/vector-data";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "Debriefs — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Debrief hub -- the same StudentDebriefHub component and DEBRIEFS fixture data app/v2/debrief/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentDebriefHub() {
  const [latest, ...history] = DEBRIEFS.map(
    (d): StudentDebriefRow => ({
      id: d.id,
      href: HREFS.debriefLatest,
      label: d.lesson,
      dateLabel: d.date,
      instructorLabel: d.instructor,
      durationLabel: d.length,
    }),
  );

  return <StudentDebriefHub justLandedHref={HREFS.debriefNew} latest={latest ?? null} history={history} />;
}
