import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlightAnalysisScreen, type FlightAnalysisMomentRow } from "@/components/student/flights/flight-analysis";
import { FLIGHTS, flightById, formatHours } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { momentTone, formatElapsed } from "@/lib/student/telemetry";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => f.track).map((f) => ({ id: f.id }));
}

/** Milestone 1B fixture-parity Flight Analysis -- mechanically the same as app/prototype/vector/flights/[id]/analysis/page.tsx, hrefs repointed at /v2/**. */
export default async function V2AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  if (!flight || !analysis) notFound();

  const approaches = analysis.segments.filter((s) => s.type === "APPROACH");
  const moments: FlightAnalysisMomentRow[] = analysis.moments.map((m) => ({
    id: m.id,
    href: `/v2/flights/${id}/moments/${m.id}`,
    title: m.title,
    type: m.type,
    tone: momentTone(m.type),
    instructorEvidence: m.instructorEvidence,
    flightDataLabel: m.flightData[0]?.value ?? null,
    acsArea: m.acsArea,
  }));

  return (
    <FlightAnalysisScreen
      backHref={`/v2/flights/${id}`}
      kicker={`${flight.dateLabel} · ${flight.departureAirport} → ${flight.arrivalAirport}`}
      metaLine={`${flight.aircraftType} · ${flight.tailNumber} · ${flight.instructor ?? "Solo"} · ${formatHours(flight.durationMinutes)} hr tracked`}
      track={flight.track}
      hasAdsbLookup={flight.fr24FlightId !== null}
      replayHref={`/v2/flights/${id}/replay`}
      compareHref={approaches.length > 1 ? `/v2/flights/${id}/compare` : null}
      segments={analysis.segments.map((s) => ({ id: s.id, label: s.label, elapsedLabel: formatElapsed(s.startT) }))}
      approachCount={approaches.length}
      moments={moments}
    />
  );
}
