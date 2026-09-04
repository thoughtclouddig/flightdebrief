import { Play } from "lucide-react";
import { AcsBadge, BackLink, Evidence, PageTitle, PrimaryButton, Screen, Section, SecondaryButton } from "@/components/student/ui";
import { MomentTrack } from "@/components/student/moment-track";
import type { FlightTelemetry, FlightSegment } from "@/lib/student/telemetry";

/**
 * Moment Detail: one instructional point, with all four kinds of evidence --
 * shared between app/prototype/vector/flights/[id]/moments/[moment]/page.tsx
 * and app/v2/flights/[id]/moments/[moment]/page.tsx.
 *
 * Order is the argument: what happened, what the instructor said, what the
 * data shows, what Vector makes of it, which standard it belongs to, what to
 * do. Reversing any two of those changes what the screen is claiming --
 * putting Vector above the instructor would make the inference look like the
 * judgment.
 */
export function MomentDetailScreen({
  backHref,
  kicker,
  title,
  telemetry,
  segment,
  instructorEvidence,
  flightData,
  vectorInference,
  acsArea,
  acsCode,
  replayHref,
  compareHref,
  compareLabel,
  trainHref,
}: {
  backHref: string;
  kicker: string;
  title: string;
  telemetry: FlightTelemetry;
  segment: FlightSegment;
  instructorEvidence: { who: string; quote: string } | null;
  flightData: { label: string; value: string }[];
  vectorInference: string | null;
  acsArea: string | null;
  acsCode: string | null;
  replayHref: string;
  compareHref: string | null;
  compareLabel: string | null;
  trainHref: string;
}) {
  return (
    <Screen>
      <BackLink href={backHref}>Flight analysis</BackLink>
      <PageTitle kicker={kicker}>{title}</PageTitle>

      <MomentTrack telemetry={telemetry} segment={segment} />

      {instructorEvidence ? (
        <Section title={<>{instructorEvidence.who} said</>} flush>
          <Evidence label={instructorEvidence.who} tone="instructor" text={instructorEvidence.quote} />
          <p className="px-1.5 pt-2 text-[14px] text-foreground-faint">From the debrief · linked to {segment.label}</p>
        </Section>
      ) : null}

      {flightData.length > 0 ? (
        <Section title={<>What the flight data shows</>}>
          <ul className="flex flex-col gap-3.5">
            {flightData.map((d) => (
              <li key={d.label}>
                <p className="text-[15px] font-medium text-foreground-faint">{d.label}</p>
                <p className="mt-0.5 text-[17px] leading-snug text-foreground">{d.value}</p>
              </li>
            ))}
          </ul>
          <p className="pt-3 text-[14px] leading-relaxed text-foreground-faint">
            From flight tracking. Groundspeed and altitude only &mdash; ADS-B doesn&rsquo;t report airspeed or control
            position.
          </p>
        </Section>
      ) : null}

      {vectorInference ? (
        <Section title={<>What Vector makes of it</>} flush>
          <Evidence label="Vector" tone="vector" quoted={false} text={vectorInference} />
        </Section>
      ) : null}

      {acsArea ? <AcsBadge area={acsArea} code={acsCode ?? undefined} /> : null}

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href={replayHref}>
          <Play className="size-[18px] fill-current" aria-hidden />
          Replay this moment
        </PrimaryButton>
        {compareHref && compareLabel ? <SecondaryButton href={compareHref}>Compare with {compareLabel}</SecondaryButton> : null}
        <SecondaryButton href={trainHref}>Train this with Vector</SecondaryButton>
      </div>
    </Screen>
  );
}
