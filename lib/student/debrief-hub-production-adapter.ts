import type { StudentDebriefRow } from "@/components/student/debrief/student-debrief-hub";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { formatAudioDuration, formatFlightDate } from "@/lib/utils";

export interface ProductionDebriefHubProps {
  justLandedHref: string;
  latest: StudentDebriefRow | null;
  history: StudentDebriefRow[];
}

/**
 * Real Debrief hub -- feeds components/student/debrief/student-debrief-hub.tsx
 * (the approved V2 presentation) from real flight/debrief data. Shared
 * between app/(product)/debrief/page.tsx and app/v2/debrief/page.tsx.
 *
 * debriefResultsHref/newDebriefHref/startDebriefHref let each caller supply
 * its own route family (canonical vs /v2) without this adapter hardcoding
 * either -- the actual state computation (which flight is pending, which are
 * already debriefed) is identical either way and lives exactly once.
 */
export async function buildProductionDebriefHubProps(
  repo: Repository,
  viewer: Viewer,
  hrefs: {
    debriefResultsHref: (flightId: string) => string;
    newDebriefHref: string;
    startDebriefHref: (flightId: string) => string;
  },
): Promise<ProductionDebriefHubProps> {
  const flights = await repo.listFlights({ studentId: viewer.user.id });

  const pendingFlight =
    [...flights].filter((f) => f.debriefStatus !== "complete").sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;

  const debriefed = flights
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));

  const rows = await Promise.all(
    debriefed.map(async (flight): Promise<StudentDebriefRow> => {
      const [debrief, tasks] = await Promise.all([repo.getDebriefByFlight(flight.id), repo.listFlightTasks(flight.id)]);
      const lessonFocus = deriveLessonFocus(tasks);
      return {
        id: flight.id,
        href: hrefs.debriefResultsHref(flight.id),
        label: lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`,
        dateLabel: formatFlightDate(flight.flightDate),
        instructorLabel: resolveCfiFirstName(flight.instructor),
        durationLabel: debrief ? formatAudioDuration(debrief.audioDurationSeconds) : null,
      };
    }),
  );
  const [latest, ...history] = rows;

  return {
    justLandedHref: pendingFlight ? hrefs.startDebriefHref(pendingFlight.id) : hrefs.newDebriefHref,
    latest: latest ?? null,
    history,
  };
}
