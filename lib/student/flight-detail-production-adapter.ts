import type { Repository } from "@/lib/data/types";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import type { FlightWithRelations } from "@/lib/types";
import { TRACKED_HOURS_DISCLAIMER } from "@/lib/student/flights-list-production-adapter";

/** Real Flight Detail has no per-flight numeric skill score model (see this file's own module doc) and no per-flight carry-forward list -- both fields the shared component supports are simply absent from the return value below rather than populated with invented numbers. */
export interface ProductionFlightDetailProps {
  backHref: string;
  dateLabel: string;
  departureAirport: string;
  arrivalAirport: string;
  lesson: string;
  aircraftType: string;
  tailNumber: string;
  instructorName: string | null;
  durationLabel: string;
  trackedHoursDisclaimer: string;
  track: FlightWithRelations["track"];
  hasAdsbLookup: boolean;
  sourceLabel: string;
  needsDebrief: boolean;
  debriefHref: string;
  analysisHref: null;
  debriefStatusLabel: string | null;
  debriefDetailHref: string | null;
  hasPendingDebrief: boolean;
}

function sourceLabelFor(flight: FlightWithRelations): string {
  if (flight.fr24FlightId) return "Flight details detected from flight tracking";
  if (flight.externalProvider) return "Flight details imported";
  return "Flight details entered manually";
}

/**
 * Real Flight Detail -- feeds components/student/flights/flight-detail.tsx
 * (the approved V2 presentation) from one real flight row.
 *
 * debriefHref always points at the existing app/(product)/flights/[id]/debrief/page.tsx
 * state-machine resolver rather than duplicating its branching here -- that
 * resolver already redirects a guided/light student with no tasks yet to
 * /confirm (where Milestone 2A lets them pick their own tasks), so
 * needsDebrief only has to ask one honest question: is there a next step at
 * all (debriefStatus !== "complete")? The older student-flight-detail.tsx
 * this replaces computed its own separate tasksPending/guidanceMode gate and
 * showed a dead "Waiting on your CFI" message -- stale since the student-first
 * fix landed, and not reproduced here.
 *
 * skills/carryForward are intentionally omitted from this return value (see
 * this file's own doc comment) -- lib/skill-progress.ts's SkillProgression
 * has a categorical status, never a numeric score/max, so nothing here can
 * honestly fill FlightDetailSkillRow's score/max fields without inventing
 * numbers. hasPendingDebrief is returned rather than folded into a boolean
 * the caller can't act on, since resuming an unanalyzed recording is a real,
 * distinct capability (see components/resume-debrief-button.tsx) the shared
 * component's plain-link CTA can't express -- the caller renders that button
 * itself and passes it in as FlightDetailScreen's debriefCta.
 */
export async function buildProductionFlightDetailProps(
  repo: Repository,
  flight: FlightWithRelations,
  hrefs: { backHref: string; debriefHref: string; debriefDetailHref: string },
): Promise<ProductionFlightDetailProps> {
  const hasPendingDebrief =
    flight.debriefStatus !== "complete" && (await repo.getPendingDebriefTranscript(flight.id)) !== null;

  const dateLabel = new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    backHref: hrefs.backHref,
    dateLabel,
    departureAirport: flight.departureAirport,
    arrivalAirport: flight.arrivalAirport,
    lesson: `${flight.departureAirport} → ${flight.arrivalAirport}`,
    aircraftType: flight.aircraft.type,
    tailNumber: flight.aircraft.tailNumber,
    instructorName: flight.instructor?.name ?? null,
    durationLabel: (flight.durationMinutes / 60).toFixed(1),
    trackedHoursDisclaimer: TRACKED_HOURS_DISCLAIMER,
    track: simplifyTrackForDisplay(flight.track),
    hasAdsbLookup: flight.fr24FlightId !== null,
    sourceLabel: sourceLabelFor(flight),
    needsDebrief: flight.debriefStatus !== "complete",
    debriefHref: hrefs.debriefHref,
    analysisHref: null,
    debriefStatusLabel: flight.debriefStatus === "complete" ? "Debriefed" : null,
    debriefDetailHref: flight.debriefStatus === "complete" ? hrefs.debriefDetailHref : null,
    hasPendingDebrief,
  };
}
