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
import { FLIGHTS, flightById } from "@/lib/prototype/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { compareSegments } from "@/lib/prototype/telemetry";
import { ACS_AREAS } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => analysisFor(f.id)).map((f) => ({ id: f.id }));
}

/**
 * Compare attempts.
 *
 * The question is "what changed", never "which was better". A pass/fail frame
 * would put the product in the instructor's chair, and it would also be the
 * less useful answer -- a student already knows Approach 3 felt better. What
 * they cannot see from the cockpit is WHY, and two overlaid tracks with the
 * numbers underneath is the shortest route to it.
 *
 * Every row is a relative difference computed from the two segments. Nothing
 * here says "stabilized" or "met criteria": ADS-B cannot support that, and it
 * is a judgement in any case.
 */
export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  if (!flight || !analysis) notFound();

  const approaches = analysis.segments.filter((s) => s.type === "APPROACH");
  const a = approaches.find((s) => s.id === "approach-2") ?? approaches[0];
  const b = approaches.find((s) => s.id === "approach-3") ?? approaches[approaches.length - 1];
  if (!a || !b || a.id === b.id) notFound();

  const rows = compareSegments(analysis.telemetry, a, b);
  const momentB = analysis.moments.find((m) => m.segmentId === b.id);

  const pts = analysis.telemetry.points;

  /*
   * Fit to what is actually drawn.
   *
   * These bounds used to come from the whole flight while only the two
   * approach segments were rendered, so both attempts were squeezed into
   * whatever fraction of the full-flight extent the approaches happened to
   * occupy -- in practice a flat smear across the bottom of an empty box, on
   * the one screen whose entire purpose is comparing two shapes.
   *
   * Scale is a single factor for both axes rather than one per axis. Fitting
   * each axis independently stretches the picture to fill the frame, and on a
   * ground track that is a lie: it would make a wide shallow turn and a tight
   * one look alike, which is the exact difference the student is here to see.
   * Longitude is multiplied by cos(lat) first so a degree of longitude and a
   * degree of latitude cover comparable ground at this latitude.
   */
  const shown = [...pts.slice(a.startIndex, a.endIndex + 1), ...pts.slice(b.startIndex, b.endIndex + 1)];
  const lats = shown.map((p) => p.lat);
  const lons = shown.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const PAD = 18;
  const BOX_W = 300;
  const BOX_H = 200;
  const innerW = BOX_W - PAD * 2;
  const innerH = BOX_H - PAD * 2;

  const lonScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const spanX = Math.max((maxLon - minLon) * lonScale, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);
  const scale = Math.min(innerW / spanX, innerH / spanY);

  // Centre the fitted track in whichever axis has slack left over.
  const offsetX = PAD + (innerW - spanX * scale) / 2;
  const offsetY = PAD + (innerH - spanY * scale) / 2;

  const x = (lon: number) => offsetX + (lon - minLon) * lonScale * scale;
  const y = (lat: number) => offsetY + (maxLat - lat) * scale;
  const path = (s: typeof a) =>
    pts
      .slice(s.startIndex, s.endIndex + 1)
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`)
      .join(" ");

  return (
    <Screen>
      <BackLink href={`/prototype/vector/flights/${id}/analysis`}>Flight analysis</BackLink>
      <PageTitle kicker={`${flight.dateLabel} · ${flight.lesson}`}>
        {a.label} vs {b.label}
      </PageTitle>

      {/* Overlay rather than side by side: the two paths share a runway, and
          seeing them on one set of axes is the entire comparison. */}
      <Section title={<>Ground track</>} flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={`${a.label} and ${b.label} overlaid`}>
            <path d={path(a)} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-state-attention-fill" />
            <path d={path(b)} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-state-good" />
          </svg>
        </div>
        <div className="flex gap-5 px-1.5 pt-3">
          <span className="flex items-center gap-2 text-[15px] text-foreground">
            <span className="h-1 w-5 rounded-full bg-state-attention-fill" aria-hidden />
            {a.label}
          </span>
          <span className="flex items-center gap-2 text-[15px] text-foreground">
            <span className="h-1 w-5 rounded-full bg-state-good" aria-hidden />
            {b.label}
          </span>
        </div>
      </Section>

      {rows.length > 0 ? (
        <Section title={<>What changed</>}>
          <div className="flex flex-col">
            {rows.map((r) => (
              <div key={r.label} className="border-b border-hairline py-4 last:border-b-0">
                <p className="text-[15px] font-medium text-foreground-faint">{r.label}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <p className="text-[17px] text-foreground">
                    <span className="font-medium">{a.label}:</span>{" "}
                    <span className="text-foreground-soft">{r.a}</span>
                  </p>
                  <p className="text-[17px] text-foreground">
                    <span className="font-medium">{b.label}:</span>{" "}
                    <span className="text-foreground-soft">{r.b}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="pt-3 text-[14px] leading-relaxed text-foreground-faint">
            Measured from the position and altitude record. Less variation is not automatically better &mdash;
            it&rsquo;s what your instructor was describing.
          </p>
        </Section>
      ) : null}

      {momentB?.instructorEvidence ? (
        <Section title={<>{momentB.instructorEvidence.who} said</>} flush>
          <Evidence
            label={momentB.instructorEvidence.who}
            tone="instructor"
            text={momentB.instructorEvidence.quote}
          />
          <p className="px-1.5 pt-2 text-[14px] text-foreground-faint">
            From the debrief · linked to {b.label}
          </p>
        </Section>
      ) : null}

      <Section title={<>Vector</>} flush>
        <Evidence
          label="Vector"
          tone="vector"
          quoted={false}
          text={`Based on the available flight data, ${b.label.toLowerCase()} appears to have settled earlier and needed fewer corrections near the runway. That lines up with what ${flight.instructor?.split(" ")[0] ?? "your instructor"} said about it.`}
        />
      </Section>

      <AcsBadge area={ACS_AREAS.landings} code="PA.IV.E" />

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/train">Train this with Vector</PrimaryButton>
        <div className="flex gap-2.5">
          <SecondaryButton href={`/prototype/vector/flights/${id}/replay?t=${Math.round(a.startT)}`}>
            <Play className="size-4 fill-current" aria-hidden />
            {a.label}
          </SecondaryButton>
          <SecondaryButton href={`/prototype/vector/flights/${id}/replay?t=${Math.round(b.startT)}`}>
            <Play className="size-4 fill-current" aria-hidden />
            {b.label}
          </SecondaryButton>
        </div>
      </div>
    </Screen>
  );
}
