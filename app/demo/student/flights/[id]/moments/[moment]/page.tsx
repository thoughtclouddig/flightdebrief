import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MomentDetailScreen } from "@/components/student/flights/moment-detail";
import { FLIGHTS, flightById } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.flatMap((f) => (analysisFor(f.id)?.moments ?? []).map((m) => ({ id: f.id, moment: m.id })));
}

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Moment Detail -- the same MomentDetailScreen component app/v2/flights/[id]/moments/[moment]/page.tsx renders, hrefs built from /demo/student instead of /v2. */
export default async function DemoStudentMomentDetail({ params }: { params: Promise<{ id: string; moment: string }> }) {
  const { id, moment: momentId } = await params;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  const moment = analysis?.moments.find((m) => m.id === momentId);
  const segment = analysis?.segments.find((s) => s.id === moment?.segmentId);
  if (!flight || !analysis || !moment || !segment) notFound();

  // The other approach to compare against: the best attempt if this one needs
  // work, otherwise the one that needed work.
  const other = analysis.moments.find((m) => m.id !== moment.id && m.segmentId.startsWith("approach"));

  return (
    <MomentDetailScreen
      backHref={HREFS.flightAnalysis(id)}
      kicker={`${flight.dateLabel} · ${segment.label}`}
      title={moment.title}
      telemetry={analysis.telemetry}
      segment={segment}
      instructorEvidence={moment.instructorEvidence}
      flightData={moment.flightData}
      vectorInference={moment.vectorInference}
      acsArea={moment.acsArea}
      acsCode={moment.acsTask}
      replayHref={HREFS.flightReplay(id, Math.round(segment.startT))}
      compareHref={other ? HREFS.flightCompare(id) : null}
      compareLabel={other?.title ?? null}
      trainHref={HREFS.train}
    />
  );
}
