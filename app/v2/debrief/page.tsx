import type { Metadata } from "next";
import { StudentDebriefHub, type StudentDebriefRow } from "@/components/student/debrief/student-debrief-hub";
import { DEBRIEFS } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { title: "Debriefs — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1B fixture-parity Debrief hub -- mechanically the same as app/prototype/vector/debrief/page.tsx. /debrief/new and /debrief/latest now exist under /v2, so both are real, live destinations. */
export default function V2DebriefHub() {
  const [latest, ...history] = DEBRIEFS.map(
    (d): StudentDebriefRow => ({
      id: d.id,
      href: "/v2/debrief/latest",
      label: d.lesson,
      dateLabel: d.date,
      instructorLabel: d.instructor,
      durationLabel: d.length,
    }),
  );

  return <StudentDebriefHub justLandedHref="/v2/debrief/new" latest={latest ?? null} history={history} />;
}
