import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";
import { FlightReplay } from "@/components/student/flight-replay";
import { FLIGHTS, flightById, formatHours } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => f.track).map((f) => ({ id: f.id }));
}

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Flight Replay -- the same FlightReplay component app/v2/flights/[id]/replay/page.tsx renders, hrefs built from /demo/student instead of /v2. */
export default async function DemoStudentReplayPage({
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
      <BackLink href={HREFS.flightAnalysis(id)}>Flight analysis</BackLink>
      <PageTitle kicker={`${flight.dateLabel} · ${flight.departureAirport} · ${formatHours(flight.durationMinutes)} hr`}>
        Flight replay
      </PageTitle>
      <FlightReplay
        telemetry={analysis.telemetry}
        segments={analysis.segments}
        moments={analysis.moments}
        startT={Number(t) || 0}
        trainHref={HREFS.train}
        compareHref={HREFS.flightCompare("aug-29")}
      />
    </Screen>
  );
}
