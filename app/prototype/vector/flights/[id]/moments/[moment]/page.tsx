import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import {
  AcsBadge,
  BackLink,
  Evidence,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
} from "@/components/prototype/ui";
import { MomentTrack } from "@/components/prototype/moment-track";
import { FLIGHTS, flightById } from "@/lib/prototype/flights";
import { analysisFor } from "@/lib/prototype/moments";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.flatMap((f) => (analysisFor(f.id)?.moments ?? []).map((m) => ({ id: f.id, moment: m.id })));
}

/**
 * Moment Detail: one instructional point, with all four kinds of evidence.
 *
 * Order is the argument: what happened, what Jake said, what the data shows,
 * what Vector makes of it, which standard it belongs to, what to do. Reversing
 * any two of those changes what the screen is claiming -- putting Vector above
 * Jake would make the inference look like the judgement.
 */
export default async function MomentDetail({ params }: { params: Promise<{ id: string; moment: string }> }) {
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
    <Screen>
      <BackLink href={`/prototype/vector/flights/${id}/analysis`}>Flight analysis</BackLink>
      <PageTitle kicker={`${flight.dateLabel} · ${segment.label}`}>{moment.title}</PageTitle>

      <MomentTrack telemetry={analysis.telemetry} segment={segment} />

      {moment.instructorEvidence ? (
        <Section title={<>{moment.instructorEvidence.who} said</>} flush>
          <Evidence
            label={moment.instructorEvidence.who}
            tone="instructor"
            text={moment.instructorEvidence.quote}
          />
          {/* Stated, not implied. This came off the ramp, not the intercom. */}
          <p className="px-1.5 pt-2 text-[14px] text-foreground-faint">
            From the debrief · linked to {segment.label}
          </p>
        </Section>
      ) : null}

      {moment.flightData.length > 0 ? (
        <Section title={<>What the flight data shows</>}>
          <ul className="flex flex-col gap-3.5">
            {moment.flightData.map((d) => (
              <li key={d.label}>
                <p className="text-[15px] font-medium text-foreground-faint">{d.label}</p>
                <p className="mt-0.5 text-[17px] leading-snug text-foreground">{d.value}</p>
              </li>
            ))}
          </ul>
          <p className="pt-3 text-[14px] leading-relaxed text-foreground-faint">
            From flight tracking. Groundspeed and altitude only &mdash; ADS-B doesn&rsquo;t report airspeed or
            control position.
          </p>
        </Section>
      ) : null}

      {moment.vectorInference ? (
        <Section title={<>What Vector makes of it</>} flush>
          <Evidence label="Vector" tone="vector" quoted={false} text={moment.vectorInference} />
        </Section>
      ) : null}

      {moment.acsArea ? <AcsBadge area={moment.acsArea} code={moment.acsTask ?? undefined} /> : null}

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href={`/prototype/vector/flights/${id}/replay?t=${Math.round(segment.startT)}`}>
          <Play className="size-[18px] fill-current" aria-hidden />
          Replay this moment
        </PrimaryButton>
        {other ? (
          <SecondaryButton href={`/prototype/vector/flights/${id}/compare`}>
            Compare with {other.title}
          </SecondaryButton>
        ) : null}
        <SecondaryButton href="/prototype/vector/train">Train this with Vector</SecondaryButton>
      </div>
    </Screen>
  );
}
