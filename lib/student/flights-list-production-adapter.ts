import type { Repository } from "@/lib/data/types";
import type { FlightListRow } from "@/components/student/flights/flights-list";
import type { DebriefStatus } from "@/lib/types";

const STATUS_LABEL: Record<DebriefStatus, string> = {
  not_started: "Needs debrief",
  in_progress: "Debrief started",
  complete: "Debriefed",
};

/** Shared with lib/student/flight-detail-production-adapter.ts so the wording can't drift between the two real screens. */
export const TRACKED_HOURS_DISCLAIMER =
  "Tracked hours are based on flights detected or confirmed in AfterFlight. They are not a substitute for your official pilot logbook.";

/**
 * Real My Flights -- feeds components/student/flights/flights-list.tsx (the
 * approved V2 presentation) from repo.listFlights(), mirroring
 * app/(product)/dashboard/page.tsx's own prior inline logic exactly (same
 * sort, same tracked-hours sum, same status labels).
 *
 * Every row here already happened and was confirmed by the student -- unlike
 * the fixture's FLIGHTS (which include PLANNED/DETECTED rows a trackedHours()
 * helper has to filter out), so nothing is excluded from the sum.
 *
 * "Lesson" has no real column -- flights carry no curriculum/lesson-name
 * field at all (see lib/types.ts's Flight interface) -- so the route itself
 * (departure -> arrival) is the honest substitute, the same text real
 * production has always headlined this list with.
 */
export async function buildProductionFlightsListProps(
  repo: Repository,
  studentId: string,
  hrefs: { backHref: string; addFlightHref: string; flightHref: (flightId: string) => string },
) {
  const flights = await repo.listFlights({ studentId });
  const sorted = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const trackedHours = flights.reduce((sum, f) => sum + f.durationMinutes, 0) / 60;

  const rows: FlightListRow[] = sorted.map((f) => ({
    id: f.id,
    href: hrefs.flightHref(f.id),
    lesson: `${f.departureAirport} → ${f.arrivalAirport}`,
    dateLabel: new Date(f.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    departureAirport: f.departureAirport,
    arrivalAirport: f.arrivalAirport,
    durationLabel: (f.durationMinutes / 60).toFixed(1),
    aircraftType: f.aircraft.type,
    tailNumber: f.aircraft.tailNumber,
    instructorName: f.instructor?.name ?? null,
    statusLabel: STATUS_LABEL[f.debriefStatus],
    needsAction: f.debriefStatus !== "complete",
    hasTrack: Boolean(f.track && f.track.length > 0),
  }));

  return {
    backHref: hrefs.backHref,
    addFlightHref: hrefs.addFlightHref,
    trackedHoursLabel: trackedHours.toFixed(1),
    trackedHoursDisclaimer: TRACKED_HOURS_DISCLAIMER,
    flights: rows,
  };
}
