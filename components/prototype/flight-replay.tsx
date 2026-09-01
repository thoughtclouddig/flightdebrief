"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { AcsBadge, Evidence, PrimaryButton, SecondaryButton, SectionLabel } from "@/components/prototype/ui";
import {
  formatElapsed,
  momentTone,
  pointAt,
  type FlightMoment,
  type FlightSegment,
  type FlightTelemetry,
} from "@/lib/prototype/telemetry";
import { momentForSegment, segmentAt } from "@/lib/prototype/moments";

/**
 * Flight Replay.
 *
 * One number drives this entire screen: `t`, milliseconds from engine start.
 * The map marker, the telemetry readout, the current segment, the moment card,
 * the instructor quote and the ACS row are all functions of it. Nothing here
 * holds its own clock, which is what stops this becoming five widgets that
 * drift apart the moment anything is added -- and it is why cockpit audio, POV
 * video or a richer avionics feed can be layered in later without redesigning
 * the screen. They subscribe to the same `t`.
 *
 * Deliberately not: an instrument panel, a HUD, or a wall of charts. The
 * question a student has at Approach 2 is "what did I do, and what did Jake
 * mean" -- so the readout is three numbers and the rest of the space belongs
 * to the words.
 */
export function FlightReplay({
  telemetry,
  segments,
  moments,
  /**
   * Where to open. "Replay this moment" is a promise that the scrubber will
   * already be at the moment -- landing at zero and asking the student to find
   * it again is the same as not having the button.
   */
  startT = 0,
}: {
  telemetry: FlightTelemetry;
  segments: FlightSegment[];
  moments: FlightMoment[];
  startT?: number;
}) {
  const [t, setT] = useState(Math.min(startT, telemetry.durationMs));
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const step = (now: number) => {
      const dt = now - last.current;
      last.current = now;
      // A functional update rather than a ref read: the loop needs the latest
      // t without the effect re-subscribing every frame, and reading a ref
      // during render to get it is the thing that breaks under concurrency.
      setT((prev) => {
        // 8x, so a 90-minute lesson scrubs in about eleven minutes rather
        // than ninety. Real time would be honest and unusable.
        const next = Math.min(telemetry.durationMs, prev + dt * 8);
        if (next >= telemetry.durationMs) setPlaying(false);
        return next;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, telemetry.durationMs]);

  const point = pointAt(telemetry, t);
  const segment = segmentAt(segments, t);
  const moment = momentForSegment(moments, segment?.id ?? null);
  const momentIndex = moments.findIndex((m) => m.id === moment?.id);

  function jumpToSegment(s: FlightSegment) {
    setPlaying(false);
    setT(s.startT + (s.endT - s.startT) / 2);
  }

  function stepMoment(dir: -1 | 1) {
    const next = moments[Math.max(0, Math.min(moments.length - 1, momentIndex + dir))];
    const seg = next && segments.find((s) => s.id === next.segmentId);
    if (seg) jumpToSegment(seg);
  }

  return (
    <div className="flex flex-col gap-6">
      <TrackCanvas telemetry={telemetry} segment={segment} t={t} />

      {/* The scrubber. Segments are proportional to their real duration, so
          the bar is a picture of the flight rather than an even split. */}
      <div>
        <div className="flex h-9 w-full gap-[3px]" role="group" aria-label="Flight timeline">
          {segments.map((s) => {
            const active = s.id === segment?.id;
            const width = ((s.endT - s.startT) / telemetry.durationMs) * 100;
            const m = momentForSegment(moments, s.id);
            const tone = m ? momentTone(m.type) : "neutral";
            return (
              <button
                key={s.id}
                onClick={() => jumpToSegment(s)}
                style={{ width: `${width}%` }}
                aria-label={`Jump to ${s.label}`}
                aria-current={active}
                className={cn(
                  "relative flex min-w-[26px] cursor-pointer items-end justify-center rounded-[5px] pb-1 transition-colors",
                  // Inactive segments need their own surface: the screen
                  // canvas is already sunken, so bg-surface-sunken made them
                  // invisible and the bar looked like one block and some dots.
                  active ? "bg-brand" : "bg-hairline hover:bg-foreground-faint/40",
                )}
              >
                {/* A marker, not a label: at this width a word would truncate
                    on every segment. The colour says whether the moment there
                    needs attention or went well. */}
                {m ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      active
                        ? "bg-on-brand"
                        : tone === "attention"
                          ? "bg-state-attention-fill"
                          : tone === "good"
                            ? "bg-state-good"
                            : "bg-foreground-faint",
                    )}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={telemetry.durationMs}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          aria-label="Scrub flight"
          className="mt-3 h-11 w-full cursor-pointer accent-brand"
        />

        <div className="flex items-center justify-between">
          <p className="text-[15px] tabular-nums text-foreground-faint">
            {formatElapsed(t)} / {formatElapsed(telemetry.durationMs)}
          </p>
          <p className="text-[15px] font-medium text-foreground">{segment?.label}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <RoundButton onClick={() => stepMoment(-1)} label="Previous moment">
          <ChevronLeft className="size-5" aria-hidden />
        </RoundButton>
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-brand text-on-brand transition-transform duration-200 active:scale-95"
        >
          {playing ? <Pause className="size-6 fill-current" aria-hidden /> : <Play className="ml-0.5 size-6 fill-current" aria-hidden />}
        </button>
        <RoundButton onClick={() => stepMoment(1)} label="Next moment">
          <ChevronRight className="size-5" aria-hidden />
        </RoundButton>
      </div>

      {/* Everything below is a function of t. */}
      <ContextCard point={point} telemetry={telemetry} segment={segment} moment={moment} />
    </div>
  );
}

function RoundButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-hairline text-foreground-soft transition-colors hover:border-foreground-faint/40"
    >
      {children}
    </button>
  );
}

/**
 * The track, with the aircraft where the scrubber says it is.
 *
 * Plain SVG from real lat/lon rather than a map tile: at this size the
 * basemap is decoration, and the shape of the pattern is the whole point. The
 * full interactive map lives on Flight Detail, where it has room to be useful.
 */
function TrackCanvas({
  telemetry,
  segment,
  t,
}: {
  telemetry: FlightTelemetry;
  segment: FlightSegment | null;
  t: number;
}) {
  const pts = telemetry.points;
  if (pts.length < 2) return null;

  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const pad = 0.08;
  const x = (lon: number) => ((lon - minLon) / (maxLon - minLon || 1)) * (1 - 2 * pad) * 300 + pad * 300;
  // SVG y grows downward; latitude grows north, so this inverts.
  const y = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat || 1)) * (1 - 2 * pad) * 220 + pad * 220;

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`).join(" ");
  const segPath = segment
    ? pts
        .slice(segment.startIndex, segment.endIndex + 1)
        .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`)
        .join(" ")
    : "";
  const now = pointAt(telemetry, t);

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <svg viewBox="0 0 300 220" className="w-full" role="img" aria-label="Flight path with current position">
        <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-hairline" />
        {segPath ? (
          <path d={segPath} fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand" strokeLinecap="round" />
        ) : null}
        {now ? (
          <>
            <circle cx={x(now.lon)} cy={y(now.lat)} r={7} className="fill-brand/20" />
            <circle cx={x(now.lon)} cy={y(now.lat)} r={3.5} className="fill-brand" />
          </>
        ) : null}
      </svg>
    </div>
  );
}

/**
 * The synchronized context card.
 *
 * Field order is fixed and meaningful: what the airplane did, what the person
 * said, what it means, which standard it belongs to. Telemetry rows render
 * only when the capability model says the source actually provides them --
 * groundspeed yes, indicated airspeed never, from ADS-B.
 */
function ContextCard({
  point,
  telemetry,
  segment,
  moment,
}: {
  point: ReturnType<typeof pointAt>;
  telemetry: FlightTelemetry;
  segment: FlightSegment | null;
  moment: FlightMoment | null;
}) {
  const caps = telemetry.capabilities;
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <SectionLabel>Flight data</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {caps.groundSpeed ? (
            <Readout value={point?.groundSpeedKt} unit="kt" label="Groundspeed" />
          ) : null}
          {caps.altitude ? <Readout value={point?.altitudeFt} unit="ft" label="Altitude" /> : null}
          {caps.verticalRate ? <Readout value={point?.verticalRateFpm} unit="fpm" label="Vertical rate" /> : null}
        </div>
        {/* Named where the numbers came from, and what they are not. */}
        <p className="px-1.5 text-[14px] leading-relaxed text-foreground-faint">
          From flight tracking. Groundspeed, not airspeed — ADS-B doesn&rsquo;t report what the airspeed indicator
          showed.
        </p>
      </section>

      {moment ? (
        <>
          {moment.instructorEvidence ? (
            <section className="flex flex-col gap-2.5">
              <SectionLabel>{moment.instructorEvidence.who} said</SectionLabel>
              <Evidence
                label={moment.instructorEvidence.who}
                tone="instructor"
                text={moment.instructorEvidence.quote}
              />
              {/* The anchor, stated. This quote came from the post-flight
                  debrief, so it belongs to the segment, not to a second. */}
              {moment.anchor.kind === "SEGMENT_ASSOCIATION" ? (
                <p className="px-1.5 text-[14px] text-foreground-faint">
                  From the debrief · linked to {segment?.label}
                </p>
              ) : null}
            </section>
          ) : null}

          {moment.flightData.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <SectionLabel>What the data shows</SectionLabel>
              <ul className="flex flex-col gap-2.5">
                {moment.flightData.map((d) => (
                  <li key={d.label} className="text-[17px] leading-snug text-foreground">
                    <span className="font-medium">{d.label}:</span>{" "}
                    <span className="text-foreground-soft">{d.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {moment.vectorInference ? (
            <section className="flex flex-col gap-2.5">
              <SectionLabel>Vector</SectionLabel>
              <Evidence label="Vector" tone="vector" quoted={false} text={moment.vectorInference} />
            </section>
          ) : null}

          {moment.acsArea ? <AcsBadge area={moment.acsArea} code={moment.acsTask ?? undefined} /> : null}

          <div className="flex flex-col gap-2.5">
            <PrimaryButton href="/prototype/vector/train">Train this with Vector</PrimaryButton>
            <SecondaryButton href="/prototype/vector/flights/aug-29/compare">Compare attempts</SecondaryButton>
          </div>
        </>
      ) : (
        <p className="px-1.5 text-[17px] leading-relaxed text-foreground-soft">
          Nothing was flagged in {segment?.label ?? "this part of the flight"}. Scrub to a marked segment to see what
          your instructor said about it.
        </p>
      )}
    </div>
  );
}

function Readout({ value, unit, label }: { value: number | null | undefined; unit: string; label: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-3 py-3">
      <p className="text-[22px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
        {/* An unavailable sample shows a dash, never a zero. */}
        {value == null ? "—" : Math.round(value)}
        {value == null ? "" : <span className="ml-0.5 text-[13px] font-medium text-foreground-faint">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">{label}</p>
    </div>
  );
}
