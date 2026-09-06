import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FlightDetailScreen, type FlightDetailSkillRow } from "@/components/student/flights/flight-detail";
import { ResumeDebriefButton } from "@/components/resume-debrief-button";
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
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { buildProductionFlightDetailProps } from "@/lib/student/flight-detail-production-adapter";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.map((f) => ({ id: f.id }));
}

/**
 * Milestone 1B fixture-parity Flight Detail -- mechanically the same as
 * app/prototype/vector/flights/[id]/page.tsx, hrefs repointed at /v2/**.
 *
 * Development real-data milestone: same adapter
 * app/(product)/flights/[id]/page.tsx's student branch uses.
 * getAuthorizedFlight() (not just getViewer()) enforces that this real flight
 * actually belongs to the signed-in student -- app/v2/layout.tsx's role gate
 * only confirms "a student," not "this student's own flight."
 */
export default async function V2FlightDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let authorized;
    try {
      authorized = await getAuthorizedFlight(id);
    } catch {
      redirect(`/login?from=%2Fv2%2Fflights%2F${id}&reason=no-session`);
    }
    if (!authorized) notFound();
    const { flight, viewer } = authorized;
    if (viewer.role !== "student") notFound();

    const productionProps = await buildProductionFlightDetailProps(getRepository(), flight, {
      backHref: "/v2/flights",
      debriefHref: `/v2/flights/${flight.id}/debrief`,
      debriefDetailHref: `/v2/flights/${flight.id}/debrief/results`,
    });
    return (
      <FlightDetailScreen
        {...productionProps}
        debriefCta={
          productionProps.hasPendingDebrief ? (
            <ResumeDebriefButton flightId={flight.id} resultsHref={`/v2/flights/${flight.id}/debrief/results`} />
          ) : undefined
        }
        skills={[]}
        acsArea={null}
        carryForward={null}
      />
    );
  }

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
