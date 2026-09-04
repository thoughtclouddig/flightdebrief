import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";
import { FlightReplay } from "@/components/student/flight-replay";
import { FLIGHTS, flightById, formatHours } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => f.track).map((f) => ({ id: f.id }));
}

/** Milestone 1B fixture-parity Flight Replay -- mechanically the same as app/prototype/vector/flights/[id]/replay/page.tsx, backHref repointed at /v2/**. */
export default async function V2ReplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  if (!flight || !analysis) notFound();

  return (
    <Screen>
      <BackLink href={`/v2/flights/${id}/analysis`}>Flight analysis</BackLink>
      <PageTitle kicker={`${flight.dateLabel} · ${flight.departureAirport} · ${formatHours(flight.durationMinutes)} hr`}>
        Flight replay
      </PageTitle>
      <FlightReplay
        telemetry={analysis.telemetry}
        segments={analysis.segments}
        moments={analysis.moments}
        startT={Number(t) || 0}
        trainHref="/v2/train"
        compareHref="/v2/flights/aug-29/compare"
      />
    </Screen>
  );
}
