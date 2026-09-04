import Link from "next/link";
import { ChevronRight, LineChart, Mic, Sparkles } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import {
  AcsBadge,
  BackLink,
  Evidence,
  InfoTip,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
  SkillMeter,
  StateLabel,
} from "@/components/student/ui";
import type { SkillState } from "@/lib/student/state-tone";
import type { TrackPosition } from "@/lib/types";

export interface FlightDetailSkillRow {
  slug: string;
  href: string;
  label: string;
  score: number;
  max: number;
  state: SkillState;
}

/**
 * One flight, and everything that hangs off it -- shared between
 * app/prototype/vector/flights/[id]/page.tsx and app/v2/flights/[id]/page.tsx.
 *
 * This is the screen that makes Flight a first-class object rather than a
 * label on a debrief: the track, the debrief, the skills it moved and the
 * carry-forward items all live here, under the flight that produced them.
 *
 * The map is the shipped components/flight-map.tsx -- MapLibre over a keyless
 * CARTO basemap, with track simplification and its own fullscreen control.
 * Reusing it rather than drawing a second map keeps one behavior for
 * sparse-ADS-B and hand-entered flights, which are different empty states.
 */
export function FlightDetailScreen({
  backHref,
  dateLabel,
  departureAirport,
  arrivalAirport,
  lesson,
  aircraftType,
  tailNumber,
  instructorName,
  durationLabel,
  trackedHoursDisclaimer,
  track,
  hasAdsbLookup,
  sourceLabel,
  needsDebrief,
  debriefHref,
  analysisHref,
  debriefStatusLabel,
  debriefDetailHref,
  skills,
  acsArea,
  carryForward,
}: {
  backHref: string;
  dateLabel: string;
  departureAirport: string;
  arrivalAirport: string;
  lesson: string;
  aircraftType: string;
  tailNumber: string;
  instructorName: string | null;
  durationLabel: string;
  trackedHoursDisclaimer: string;
  track: TrackPosition[] | null;
  hasAdsbLookup: boolean;
  sourceLabel: string;
  needsDebrief: boolean;
  debriefHref: string;
  analysisHref: string | null;
  /** Null when the flight has no debrief yet -- the section still shows, with an explanatory sentence instead of a link. */
  debriefStatusLabel: string | null;
  debriefDetailHref: string | null;
  skills: FlightDetailSkillRow[];
  acsArea: string | null;
  carryForward: { items: string[]; instructorFirstName: string; instructorQuote: string; trainHref: string } | null;
}) {
  return (
    <Screen>
      <BackLink href={backHref}>My flights</BackLink>

      <div>
        <p className="text-[15px] text-foreground-faint">
          {dateLabel} · {departureAirport} → {arrivalAirport}
        </p>
        <h1 className="mt-0.5 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{lesson}</h1>
        <p className="mt-2 text-[17px] text-foreground-soft">
          {aircraftType} · {tailNumber} · {instructorName ?? "Solo"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[17px] text-foreground-soft">
          <span className="font-medium tabular-nums text-foreground">{durationLabel} hr</span>
          tracked
          <InfoTip label="Tracked hours">{trackedHoursDisclaimer}</InfoTip>
        </p>
      </div>

      {needsDebrief ? (
        <PrimaryButton href={debriefHref}>
          <Mic className="size-[18px]" aria-hidden />
          Start debrief
        </PrimaryButton>
      ) : null}

      <Section title={<>Flight path</>} flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <FlightMap track={track} hasAdsbLookup={hasAdsbLookup} />
        </div>
        <p className="px-1.5 pt-2 text-[14px] text-foreground-faint">{sourceLabel}</p>
      </Section>

      {analysisHref ? (
        <SecondaryButton href={analysisHref}>
          <LineChart className="size-[18px]" aria-hidden />
          View flight analysis
        </SecondaryButton>
      ) : null}

      {debriefDetailHref ? (
        <Section title={<>Debrief</>}>
          <Link href={debriefDetailHref} className="flex min-h-[56px] items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] text-foreground">{debriefStatusLabel}</span>
              <span className="block text-[15px] text-foreground-faint">
                What went well, what to work on, and what {instructorName?.split(" ")[0] ?? "you"} wants next
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
          </Link>
        </Section>
      ) : (
        <Section title={<>Debrief</>}>
          <p className="py-1 text-[17px] leading-relaxed text-foreground-soft">
            {instructorName
              ? "Nothing captured for this flight yet. A debrief is what turns it into something to train against."
              : "No debrief on this solo flight. You can still add your own reflection."}
          </p>
        </Section>
      )}

      {skills.length > 0 ? (
        <Section title={<>Skills this flight moved</>}>
          <div className="flex flex-col">
            {skills.map((s) => (
              <Link
                key={s.slug}
                href={s.href}
                className="flex min-h-[64px] items-center gap-4 border-b border-hairline py-3.5 last:border-b-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-medium text-foreground">{s.label}</span>
                  <StateLabel state={s.state} />
                </span>
                <SkillMeter score={s.score} max={s.max} state={s.state} />
                <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
              </Link>
            ))}
          </div>
          {acsArea ? (
            <div className="pt-3">
              <AcsBadge area={acsArea} />
            </div>
          ) : null}
        </Section>
      ) : null}

      {carryForward ? (
        <>
          <Section title={<>Carry forward</>}>
            <ol className="flex flex-col gap-3">
              {carryForward.items.map((f, i) => (
                <li key={f} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[14px] font-semibold tabular-nums text-foreground-faint">
                    {i + 1}
                  </span>
                  <span className="text-[17px] leading-snug text-foreground">{f}</span>
                </li>
              ))}
            </ol>
            <div className="pt-4">
              <Evidence label={carryForward.instructorFirstName} tone="instructor" text={carryForward.instructorQuote} />
            </div>
          </Section>

          <SecondaryButton href={carryForward.trainHref}>
            <Sparkles className="size-[18px]" aria-hidden />
            Train this with Vector
          </SecondaryButton>
        </>
      ) : null}
    </Screen>
  );
}
