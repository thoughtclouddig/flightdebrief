import type { Metadata } from "next";
import { StudentDebriefHub, type StudentDebriefRow } from "@/components/student/debrief/student-debrief-hub";
import { DEBRIEFS } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { title: "Debriefs — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1A fixture-parity Debrief hub -- mechanically the same as
 * app/prototype/vector/debrief/page.tsx. The hub itself is in scope, but
 * what it links to (Start a new debrief -> /debrief/new, each row ->
 * /debrief/latest) is the full Debrief lifecycle/Detail work, explicitly out
 * of Milestone 1A -- so the panel and every row render exactly as the
 * prototype does, just disabled, rather than either hidden or pointed at a
 * route that doesn't exist yet.
 */
export default function V2DebriefHub() {
  const [latest, ...history] = DEBRIEFS.map(
    (d): StudentDebriefRow => ({
      id: d.id,
      href: "/v2/debrief/latest",
      label: d.lesson,
      dateLabel: d.date,
      instructorLabel: d.instructor,
      durationLabel: d.length,
      disabled: true,
    }),
  );

  return (
    <StudentDebriefHub
      justLandedHref="/v2/debrief/new"
      justLandedDisabled
      latest={latest ?? null}
      history={history}
    />
  );
}
