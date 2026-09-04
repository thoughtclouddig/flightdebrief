import { StudentDebriefHub, type StudentDebriefRow } from "@/components/student/debrief/student-debrief-hub";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { formatAudioDuration, formatFlightDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Thin data-fetching wrapper -- all the real content lives in
 * components/student/debrief/student-debrief-hub.tsx, the same component
 * app/prototype/vector/debrief/page.tsx renders with fixture props.
 *
 * The "Just landed?" panel is the primary action of this screen and always
 * stays visible, even with no auto-selected pending flight -- it just leads
 * somewhere that explains/selects/adds one (/debrief/new) instead of the
 * direct flight route in that case. Real data only.
 */
export default async function DebriefHub() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ studentId: viewer.user.id });

  const pendingFlight = [...flights]
    .filter((f) => f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;

  const debriefed = flights
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));

  const rows = await Promise.all(
    debriefed.map(async (flight): Promise<StudentDebriefRow> => {
      const [debrief, tasks] = await Promise.all([repo.getDebriefByFlight(flight.id), repo.listFlightTasks(flight.id)]);
      // Same rule as Train: this row is naming what was trained, not
      // identifying the airplane. Real flight_tasks (guided-mode debriefs)
      // give a real lesson title; a freeform debrief has none, and the
      // route is the fallback there -- a row can't be blank the way a
      // sentence can gracefully drop a clause, so this is a labeled
      // fallback, not a silent substitution.
      const lessonFocus = deriveLessonFocus(tasks);
      return {
        id: flight.id,
        href: `/flights/${flight.id}/debrief/results`,
        label: lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`,
        dateLabel: formatFlightDate(flight.flightDate),
        instructorLabel: resolveCfiFirstName(flight.instructor),
        durationLabel: debrief ? formatAudioDuration(debrief.audioDurationSeconds) : null,
      };
    }),
  );
  const [latest, ...history] = rows;

  return (
    <StudentDebriefHub
      justLandedHref={pendingFlight ? `/flights/${pendingFlight.id}/debrief` : "/debrief/new"}
      latest={latest ?? null}
      history={history}
    />
  );
}
