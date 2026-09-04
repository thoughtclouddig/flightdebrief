import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import { AcsBadge, BackLink, Evidence, PageTitle, PrimaryButton, Screen, Section, SecondaryButton } from "@/components/student/ui";
import { cn } from "@/lib/utils";
import type { TrackPosition } from "@/lib/types";
import type { MomentType } from "@/lib/student/telemetry";

export interface FlightAnalysisSegmentRow {
  id: string;
  label: string;
  elapsedLabel: string;
}

export interface FlightAnalysisMomentRow {
  id: string;
  href: string;
  title: string;
  type: MomentType;
  tone: "attention" | "good" | "neutral";
  instructorEvidence: { who: string; quote: string } | null;
  flightDataLabel: string | null;
  acsArea: string | null;
}

/** Only these three carry a label -- DECISION/NEUTRAL render blank, matching the original inline ternary exactly. */
const MOMENT_TYPE_LABEL: Partial<Record<MomentType, string>> = {
  NEEDS_ATTENTION: "Needs attention",
  BEST_ATTEMPT: "Best attempt",
  IMPROVED: "Improved",
};

/**
 * Flight Analysis: the flight as evidence -- shared between
 * app/prototype/vector/flights/[id]/analysis/page.tsx and
 * app/v2/flights/[id]/analysis/page.tsx.
 *
 * The visualization is not the product. What a student needs from this screen
 * is which attempts happened, what was said about each, and what the data
 * shows -- so the map is a single glance at the top and the rest of the screen
 * is moments. Replay is where the same material becomes interrogable.
 */
export function FlightAnalysisScreen({
  backHref,
  kicker,
  metaLine,
  track,
  hasAdsbLookup,
  replayHref,
  compareHref,
  segments,
  approachCount,
  moments,
}: {
  backHref: string;
  kicker: string;
  metaLine: string;
  track: TrackPosition[] | null;
  hasAdsbLookup: boolean;
  replayHref: string;
  compareHref: string | null;
  segments: FlightAnalysisSegmentRow[];
  approachCount: number;
  moments: FlightAnalysisMomentRow[];
}) {
  return (
    <Screen>
      <BackLink href={backHref}>Flight</BackLink>
      <PageTitle kicker={kicker}>Flight analysis</PageTitle>
      <p className="-mt-4 px-1.5 text-[17px] text-foreground-soft">{metaLine}</p>

      <Section title={<>Flight path</>} flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <FlightMap track={track} hasAdsbLookup={hasAdsbLookup} />
        </div>
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href={replayHref}>
          <Play className="size-[18px] fill-current" aria-hidden />
          Replay this flight
        </PrimaryButton>
        {compareHref ? <SecondaryButton href={compareHref}>Compare attempts</SecondaryButton> : null}
      </div>

      <Section title={<>{approachCount} approaches detected</>}>
        <div className="flex flex-col">
          {segments.map((s) => (
            <div key={s.id} className="flex items-center gap-4 border-b border-hairline py-3.5 last:border-b-0">
              <span className="min-w-0 flex-1 text-[17px] text-foreground">{s.label}</span>
              <span className="text-[15px] tabular-nums text-foreground-faint">{s.elapsedLabel}</span>
            </div>
          ))}
        </div>
        <p className="pt-3 text-[14px] leading-relaxed text-foreground-faint">
          Segments are inferred from the altitude and position record, not reported by the aircraft.
        </p>
      </Section>

      {moments.length > 0 ? (
        <Section title={<>Flight moments</>} flush>
          <div className="flex flex-col gap-3">
            {moments.map((m) => (
              <Link key={m.id} href={m.href} className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface p-5">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5">
                    <span className="text-[17px] font-semibold text-foreground">{m.title}</span>
                    <span
                      className={cn(
                        "text-[14px] font-medium",
                        m.tone === "attention" ? "text-state-attention" : m.tone === "good" ? "text-state-good" : "text-foreground-faint",
                      )}
                    >
                      {MOMENT_TYPE_LABEL[m.type] ?? ""}
                    </span>
                  </span>
                  {m.instructorEvidence ? (
                    <span className="mt-3 block">
                      <Evidence label={m.instructorEvidence.who} tone="instructor" text={m.instructorEvidence.quote} />
                    </span>
                  ) : null}
                  {m.flightDataLabel ? (
                    <span className="mt-3 block text-[15px] leading-relaxed text-foreground-soft">
                      <span className="font-medium text-foreground">Flight data:</span> {m.flightDataLabel}
                    </span>
                  ) : null}
                  {m.acsArea ? (
                    <span className="mt-3 block">
                      <AcsBadge area={m.acsArea} />
                    </span>
                  ) : null}
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-foreground-faint" aria-hidden />
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
