import type { Metadata } from "next";
import { StudentDebriefHub, type StudentDebriefRow } from "@/components/prototype/student-debrief-hub";
import { DEBRIEFS } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Debriefs — AfterFlight", robots: { index: false, follow: false } };

/**
 * The Debrief tab is a place to START a debrief, not only to read one.
 *
 * This is the ingestion engine for the whole product: Vector, progress and
 * next-flight prep all run on what gets captured here. Previously the tab
 * opened straight into the latest debrief, which meant the single most
 * important action in the app had no home at all -- you could only reach it
 * from a flight that happened to be in the right state.
 */
export default function DebriefHub() {
  const [latest, ...history] = DEBRIEFS.map(
    (d): StudentDebriefRow => ({
      id: d.id,
      href: "/prototype/vector/debrief/latest",
      label: d.lesson,
      dateLabel: d.date,
      instructorLabel: d.instructor,
      durationLabel: d.length,
    }),
  );

  return (
    <StudentDebriefHub justLandedHref="/prototype/vector/debrief/new" latest={latest ?? null} history={history} />
  );
}
