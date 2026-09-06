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
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.map((f) => ({ id: f.id }));
}

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Flight Detail -- the same FlightDetailScreen component and fixture data app/v2/flights/[id]/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default async function DemoStudentFlightDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  if (!flight) notFound();

  const needsDebrief = flight.status === "NEEDS_DEBRIEF" || flight.status === "DEBRIEF_STARTED";
  const skills: FlightDetailSkillRow[] =
    flight.id === "aug-29"
      ? SKILL_SCORES.filter((s) => s.state !== "Meets Standard").map((s) => ({
          slug: s.slug,
          href: HREFS.skill(s.slug),
          label: s.skill,
          score: s.score,
          max: s.max,
          state: s.state,
        }))
      : [];
  const analysis = analysisFor(flight.id);

  return (
    <FlightDetailScreen
      backHref={HREFS.flights}
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
      debriefHref={HREFS.debriefNew}
      analysisHref={analysis ? HREFS.flightAnalysis(flight.id) : null}
      debriefStatusLabel={flight.debriefId ? statusLabel(flight.status) : null}
      debriefDetailHref={flight.debriefId ? HREFS.debriefLatest : null}
      skills={skills}
      acsArea={skills.length > 0 ? ACS_AREAS.landings : null}
      carryForward={
        flight.id === "aug-29"
          ? {
              items: STRUCTURED.nextFlightFocus,
              instructorFirstName: INSTRUCTOR.firstName,
              instructorQuote: STRUCTURED.instructorEmphasis[0]!.quote,
              trainHref: HREFS.train,
            }
          : null
      }
    />
  );
}
