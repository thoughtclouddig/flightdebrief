import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, LineChart, Mic, Sparkles } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import {
  AcsBadge,
  BackLink,
  Evidence,
  InfoTip,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
  SkillMeter,
  StateLabel,
} from "@/components/prototype/ui";
import {
  FLIGHTS,
  TRACKED_HOURS_DISCLAIMER,
  flightById,
  formatHours,
  sourceLabel,
  statusLabel,
} from "@/lib/prototype/flights";
import { ACS_AREAS, INSTRUCTOR, SKILL_SCORES, STRUCTURED } from "@/lib/prototype/vector-data";
import { analysisFor } from "@/lib/prototype/moments";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.map((f) => ({ id: f.id }));
}

/**
 * One flight, and everything that hangs off it.
 *
 * This is the screen that makes Flight a first-class object rather than a
 * label on a debrief: the track, the debrief, the skills it moved and the
 * carry-forward items all live here, under the flight that produced them.
 *
 * The map is the shipped `components/flight-map.tsx` -- MapLibre over a
 * keyless CARTO basemap, with track simplification and its own fullscreen
 * control. Reusing it rather than drawing a second map keeps one behavior for
 * sparse-ADS-B and hand-entered flights, which are different empty states and
 * were already distinguished correctly there.
 */
export default async function FlightDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  if (!flight) notFound();

  const needsDebrief = flight.status === "NEEDS_DEBRIEF" || flight.status === "DEBRIEF_STARTED";
  // Only the flight this prototype's debrief actually belongs to shows skills.
  const skills = flight.id === "aug-29" ? SKILL_SCORES.filter((s) => s.state !== "Meets Standard") : [];
  // Only offered when there is genuinely something to analyze. A screen that
  // advertises Flight Analysis and then explains it has no data is worse than
  // one that never mentioned it.
  const analysis = analysisFor(flight.id);

  return (
    <Screen>
      <BackLink href="/prototype/vector/flights">My flights</BackLink>

      <div>
        <p className="text-[15px] text-foreground-faint">
          {flight.dateLabel} · {flight.departureAirport} → {flight.arrivalAirport}
        </p>
        <h1 className="mt-0.5 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {flight.lesson}
        </h1>
        <p className="mt-2 text-[17px] text-foreground-soft">
          {flight.aircraftType} · {flight.tailNumber} · {flight.instructor ?? "Solo"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[17px] text-foreground-soft">
          <span className="font-medium tabular-nums text-foreground">{formatHours(flight.durationMinutes)} hr</span>
          tracked
          <InfoTip label="Tracked hours">{TRACKED_HOURS_DISCLAIMER}</InfoTip>
        </p>
      </div>

      {needsDebrief ? (
        <PrimaryButton href="/prototype/vector/debrief/new">
          <Mic className="size-[18px]" aria-hidden />
          Start debrief
        </PrimaryButton>
      ) : null}

      <Section title={<>Flight path</>} flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          {/* hasAdsbLookup is what separates "we looked and ADS-B was thin"
              from "you typed this in, so there was never a lookup" -- two
              different sentences, and the shipped map already gets it right. */}
          <FlightMap track={flight.track} hasAdsbLookup={flight.fr24FlightId !== null} />
        </div>
        <p className="px-1.5 pt-2 text-[14px] text-foreground-faint">{sourceLabel(flight)}</p>
      </Section>

      {analysis ? (
        <SecondaryButton href={`/prototype/vector/flights/${flight.id}/analysis`}>
          <LineChart className="size-[18px]" aria-hidden />
          View flight analysis
        </SecondaryButton>
      ) : null}

      {flight.debriefId ? (
        <Section title={<>Debrief</>}>
          <Link href="/prototype/vector/debrief/latest" className="flex min-h-[56px] items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] text-foreground">{statusLabel(flight.status)}</span>
              <span className="block text-[15px] text-foreground-faint">
                What went well, what to work on, and what {flight.instructor?.split(" ")[0] ?? "you"} wants next
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
          </Link>
        </Section>
      ) : (
        <Section title={<>Debrief</>}>
          <p className="py-1 text-[17px] leading-relaxed text-foreground-soft">
            {flight.instructor
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
                href={`/prototype/vector/progress/${s.slug}`}
                className="flex min-h-[64px] items-center gap-4 border-b border-hairline py-3.5 last:border-b-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-medium text-foreground">{s.skill}</span>
                  <StateLabel state={s.state} />
                </span>
                <SkillMeter score={s.score} max={s.max} state={s.state} />
                <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
              </Link>
            ))}
          </div>
          <div className="pt-3">
            <AcsBadge area={ACS_AREAS.landings} />
          </div>
        </Section>
      ) : null}

      {flight.id === "aug-29" ? (
        <>
          <Section title={<>Carry forward</>}>
            <ol className="flex flex-col gap-3">
              {STRUCTURED.nextFlightFocus.map((f, i) => (
                <li key={f} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[14px] font-semibold tabular-nums text-foreground-faint">
                    {i + 1}
                  </span>
                  <span className="text-[17px] leading-snug text-foreground">{f}</span>
                </li>
              ))}
            </ol>
            <div className="pt-4">
              <Evidence
                label={INSTRUCTOR.firstName}
                tone="instructor"
                text={STRUCTURED.instructorEmphasis[0]!.quote}
              />
            </div>
          </Section>

          <SecondaryButton href="/prototype/vector/train">
            <Sparkles className="size-[18px]" aria-hidden />
            Train this with Vector
          </SecondaryButton>
        </>
      ) : null}
    </Screen>
  );
}
