import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlightDetailScreen, type FlightDetailSkillRow } from "@/components/student/flights/flight-detail";
import {
  FLIGHTS,
  TRACKED_HOURS_DISCLAIMER,
  flightById,
  formatHours,
  sourceLabel,
  statusLabel,
} from "@/lib/prototype-fixtures/flights";
import { ACS_AREAS, INSTRUCTOR, SKILL_SCORES, STRUCTURED } from "@/lib/prototype-fixtures/vector-data";
import { analysisFor } from "@/lib/prototype/moments";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.map((f) => ({ id: f.id }));
}

/** Milestone 1B fixture-parity Flight Detail -- mechanically the same as app/prototype/vector/flights/[id]/page.tsx, hrefs repointed at /v2/**. */
export default async function V2FlightDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  if (!flight) notFound();

  const needsDebrief = flight.status === "NEEDS_DEBRIEF" || flight.status === "DEBRIEF_STARTED";
  const skills: FlightDetailSkillRow[] =
    flight.id === "aug-29"
      ? SKILL_SCORES.filter((s) => s.state !== "Meets Standard").map((s) => ({
          slug: s.slug,
          href: `/v2/progress/${s.slug}`,
          label: s.skill,
          score: s.score,
          max: s.max,
          state: s.state,
        }))
      : [];
  const analysis = analysisFor(flight.id);

  return (
    <FlightDetailScreen
      backHref="/v2/flights"
      dateLabel={flight.dateLabel}
      departureAirport={flight.departureAirport}
      arrivalAirport={flight.arrivalAirport}
      lesson={flight.lesson}
      aircraftType={flight.aircraftType}
      tailNumber={flight.tailNumber}
      instructorName={flight.instructor}
      durationLabel={formatHours(flight.durationMinutes)}
      trackedHoursDisclaimer={TRACKED_HOURS_DISCLAIMER}
      track={flight.track}
      hasAdsbLookup={flight.fr24FlightId !== null}
      sourceLabel={sourceLabel(flight)}
      needsDebrief={needsDebrief}
      debriefHref="/v2/debrief/new"
      analysisHref={analysis ? `/v2/flights/${flight.id}/analysis` : null}
      debriefStatusLabel={flight.debriefId ? statusLabel(flight.status) : null}
      debriefDetailHref={flight.debriefId ? "/v2/debrief/latest" : null}
      skills={skills}
      acsArea={skills.length > 0 ? ACS_AREAS.landings : null}
      carryForward={
        flight.id === "aug-29"
          ? {
              items: STRUCTURED.nextFlightFocus,
              instructorFirstName: INSTRUCTOR.firstName,
              instructorQuote: STRUCTURED.instructorEmphasis[0]!.quote,
              trainHref: "/v2/train",
            }
          : null
      }
    />
  );
}
