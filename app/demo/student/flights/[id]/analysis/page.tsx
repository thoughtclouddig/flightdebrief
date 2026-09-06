import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlightAnalysisScreen, type FlightAnalysisMomentRow } from "@/components/student/flights/flight-analysis";
import { FLIGHTS, flightById, formatHours } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { momentTone, formatElapsed } from "@/lib/student/telemetry";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => f.track).map((f) => ({ id: f.id }));
}

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Flight Analysis -- the same FlightAnalysisScreen component app/v2/flights/[id]/analysis/page.tsx renders, hrefs built from /demo/student instead of /v2. */
export default async function DemoStudentAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  if (!flight || !analysis) notFound();

  const approaches = analysis.segments.filter((s) => s.type === "APPROACH");
  const moments: FlightAnalysisMomentRow[] = analysis.moments.map((m) => ({
    id: m.id,
    href: HREFS.flightMoment(id, m.id),
    title: m.title,
    type: m.type,
    tone: momentTone(m.type),
    instructorEvidence: m.instructorEvidence,
    flightDataLabel: m.flightData[0]?.value ?? null,
    acsArea: m.acsArea,
  }));

  return (
    <FlightAnalysisScreen
      backHref={HREFS.flightDetail(id)}
      kicker={`${flight.dateLabel} · ${flight.departureAirport} → ${flight.arrivalAirport}`}
      metaLine={`${flight.aircraftType} · ${flight.tailNumber} · ${flight.instructor ?? "Solo"} · ${formatHours(flight.durationMinutes)} hr tracked`}
      track={flight.track}
      hasAdsbLookup={flight.fr24FlightId !== null}
      replayHref={HREFS.flightReplay(id)}
      compareHref={approaches.length > 1 ? HREFS.flightCompare(id) : null}
      segments={analysis.segments.map((s) => ({ id: s.id, label: s.label, elapsedLabel: formatElapsed(s.startT) }))}
      approachCount={approaches.length}
      moments={moments}
    />
  );
}
