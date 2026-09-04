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

/**
 * Flight Replay: the flight, scrubbable, with everything else derived from
 * where the scrubber is.
 *
 * Distinct from Debrief Replay, which is the spoken recap. Same word, two
 * different things, and they stay separate until there is a reason to merge
 * them -- one is audio you listen to on the drive home, this one is a thing
 * you interrogate.
 */
export default async function ReplayPage({
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
      <BackLink href={`/prototype/vector/flights/${id}/analysis`}>Flight analysis</BackLink>
      <PageTitle kicker={`${flight.dateLabel} · ${flight.departureAirport} · ${formatHours(flight.durationMinutes)} hr`}>
        Flight replay
      </PageTitle>
      <FlightReplay
        telemetry={analysis.telemetry}
        segments={analysis.segments}
        moments={analysis.moments}
        startT={Number(t) || 0}
      />
    </Screen>
  );
}
