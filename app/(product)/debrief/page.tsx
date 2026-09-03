import { StudentDebriefHub, type StudentDebriefRow } from "@/components/prototype/student-debrief-hub";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatAudioDuration, formatFlightDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Thin data-fetching wrapper -- all the real content lives in
 * components/prototype/student-debrief-hub.tsx, the same component
 * app/prototype/vector/debrief/page.tsx renders with fixture props.
 *
 * Real data only: the "just landed" panel links to the actual most-recent
 * undebriefed flight's real recording route (/flights/[id]/debrief --
 * unchanged, V1, see the Phase 4 report for why that flow's own internals
 * weren't rewritten this pass) rather than a fixture "/debrief/new"
 * destination that doesn't exist in production.
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
      const debrief = await repo.getDebriefByFlight(flight.id);
      return {
        id: flight.id,
        href: `/flights/${flight.id}/debrief/results`,
        label: `${flight.departureAirport} → ${flight.arrivalAirport}`,
        dateLabel: formatFlightDate(flight.flightDate),
        instructorLabel: resolveCfiFirstName(flight.instructor),
        durationLabel: debrief ? formatAudioDuration(debrief.audioDurationSeconds) : null,
      };
    }),
  );
  const [latest, ...history] = rows;

  return (
    <StudentDebriefHub
      justLandedHref={pendingFlight ? `/flights/${pendingFlight.id}/debrief` : null}
      latest={latest ?? null}
      history={history}
    />
  );
}
