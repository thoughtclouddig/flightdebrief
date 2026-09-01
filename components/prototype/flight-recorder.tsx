"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plane, Radio, Square, TriangleAlert } from "lucide-react";
import {
  Card,
  PageTitle,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PrimaryButton,
  Section,
  SecondaryButton,
} from "@/components/prototype/ui";
import { cn } from "@/lib/utils";
import { FLIGHT_DEFAULTS } from "@/lib/prototype/flights";
import {
  addFix,
  durations,
  looksLanded,
  startSession,
  type FlightRecordingSession,
} from "@/lib/flight-recording/session";

type Stage = "setup" | "recording" | "complete";

const STORAGE_KEY = "af-active-flight";

/**
 * Start Flight, on the phone.
 *
 * The interaction target is one tap and put the phone away, so setup confirms
 * three things it already knows and asks nothing else. Route and destination
 * are deliberately absent: the recording will observe what actually happened,
 * and asking a student to predict it before engine start is both friction and
 * a value that will be wrong.
 *
 * PLATFORM LIMIT, SHOWN NOT HIDDEN. Browser geolocation stops when the tab is
 * backgrounded or the screen locks. Promising uninterrupted tracking here and
 * delivering a track that ends at taxi would be the worst possible outcome --
 * the student only finds out after the flight, when it cannot be redone. So
 * the limit is stated before the tap, and the manual paths stay one tap away.
 */
export function FlightRecorder() {
  const [stage, setStage] = useState<Stage>("setup");
  const [session, setSession] = useState<FlightRecordingSession | null>(null);
  const [solo, setSolo] = useState(false);
  const [keepRecording, setKeepRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  // Stop the watch on unmount. High-accuracy location must never outlive the
  // session that justified asking for it.
  useEffect(() => {
    return () => {
      if (watchId.current != null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  function begin() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("This device doesn't provide location, so AfterFlight can't record the track.");
      return;
    }
    const aircraft = FLIGHT_DEFAULTS.recentAircraft[0]!;
    const fresh = startSession({
      id: `s-${Date.now()}`,
      // t0 is set at the tap, before the first fix arrives. It is the session
      // origin that cockpit audio and video will later stamp against, so it
      // cannot wait for GPS to acquire.
      t0: Date.now(),
      aircraftType: aircraft.type,
      tailNumber: aircraft.tailNumber,
      instructor: solo ? null : FLIGHT_DEFAULTS.recentInstructors[0]!,
      lesson: FLIGHT_DEFAULTS.recentLessons[0]!,
    });
    setSession(fresh);
    setStage("recording");

    watchId.current = navigator.geolocation.watchPosition(
      (p) =>
        setSession((prev) => {
          if (!prev) return prev;
          const next = addFix(prev, p);
          // Persist every fix. Waiting until the end means an OS termination
          // costs the whole flight, and a flight cannot be re-flown.
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Storage full or blocked. The in-memory session continues.
          }
          return next;
        }),
      (e) => setError(e.code === e.PERMISSION_DENIED ? "Location permission is off, so there's no track to record." : null),
      // High accuracy: pattern work needs enough resolution to reconstruct
      // approaches. maximumAge 0 so a stale fix never masquerades as current.
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  }

  function end() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSession((prev) => (prev ? { ...prev, endedAt: Date.now() } : prev));
    setStage("complete");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up.
    }
  }

  // Derived, not stored. Setting a "landed" stage from an effect would fight
  // every new fix; and the prompt is a question rather than an automatic stop,
  // because a long hold short reads exactly like a landing.
  const landed = stage === "recording" && session != null && looksLanded(session) && !keepRecording;

  if (stage === "setup") return <Setup solo={solo} setSolo={setSolo} onStart={begin} error={error} />;
  if (stage === "complete" && session) return <Complete session={session} />;
  return (
    <Active
      session={session}
      landed={landed}
      onEnd={end}
      onKeep={() => setKeepRecording(true)}
      error={error}
    />
  );
}

/* ---------------------------------------------------------------- setup */

function Setup({
  solo,
  setSolo,
  onStart,
  error,
}: {
  solo: boolean;
  setSolo: (v: boolean) => void;
  onStart: () => void;
  error: string | null;
}) {
  const a = FLIGHT_DEFAULTS.recentAircraft[0]!;
  return (
    <>
      <PageTitle kicker="Before engine start">Ready to fly?</PageTitle>

      <Section title={<>This flight</>}>
        <div className="flex flex-col">
          <Row label="Aircraft" value={`${a.type} · ${a.tailNumber}`} />
          <Row label="Departing" value={FLIGHT_DEFAULTS.homeAirport} />
          <Row label="Training" value={FLIGHT_DEFAULTS.recentLessons[0]!} last />
        </div>
      </Section>

      <Section title={<>Flying with</>}>
        <div className="flex flex-col">
          <Choice
            label={FLIGHT_DEFAULTS.recentInstructors[0]!}
            selected={!solo}
            onClick={() => setSolo(false)}
          />
          <Choice label="Solo — no instructor" selected={solo} onClick={() => setSolo(true)} last />
        </div>
      </Section>

      {/* Said before the tap, not after the flight. */}
      <Card className="flex items-start gap-3.5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-state-attention" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-medium text-foreground">Keep this screen open</span>
          {/* Three lines, and the substance is unchanged: the limitation, the
              consequence, and the way round it. Shortened by cutting the
              restatement, not the warning. */}
          <span className="mt-1 block text-[15px] leading-relaxed text-foreground-soft">
            In the browser, recording pauses if the screen locks or you switch apps. Keep AfterFlight open &mdash; or
            just add the flight afterwards.
          </span>
        </span>
      </Card>

      {error ? <p className="px-1.5 text-[15px] text-state-attention">{error}</p> : null}

      <div className="flex flex-col gap-2.5">
        <PrimaryButton onClick={onStart}>
          <Plane className="size-[18px]" aria-hidden />
          Start flight
        </PrimaryButton>
        <SecondaryButton href="/prototype/vector/flights/new">Add the flight afterwards instead</SecondaryButton>
        {/* Permission is explained here, at the moment it is asked for. */}
        <p className="px-1 text-[13px] leading-relaxed text-foreground-faint">
          AfterFlight uses your location only while a flight is recording, to build your flight path and replay. It
          stops the moment you end the flight.
        </p>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- active */

function Active({
  session,
  landed,
  onEnd,
  onKeep,
  error,
}: {
  session: FlightRecordingSession | null;
  landed: boolean;
  onEnd: () => void;
  onKeep: () => void;
  error: string | null;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!session) return null;

  const d = durations(session);
  const total = Math.round(d.sessionMs / 1000);
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  return (
    <>
      {/*
       * Deliberately almost empty. The student should be flying, not reading
       * this -- so there is no live telemetry, no map, no coaching, and
       * nothing that rewards looking at the phone.
       */}
      <Panel className="flex flex-col items-center gap-6 py-10">
        <PanelEyebrow icon={<Radio className="size-3.5" aria-hidden />} className="text-brand">
          {landed ? "Looks like you're down" : "Recording"}
        </PanelEyebrow>
        <p className="text-[52px] font-semibold leading-none tabular-nums tracking-tight">
          {hh}:{mm}:{ss}
        </p>
        <p className="text-[15px] text-panel-foreground-soft">
          {session.aircraftType} · {session.tailNumber} · {session.instructor ?? "Solo"}
        </p>
        {!landed ? (
          <span className="flex items-center gap-2 text-[15px] text-panel-foreground-soft">
            <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
            {session.fixes.length > 0 ? "Flight path recording" : "Waiting for GPS"}
          </span>
        ) : null}
      </Panel>

      {error ? <p className="px-1.5 text-[15px] text-state-attention">{error}</p> : null}

      {landed ? (
        <div className="flex flex-col gap-2.5">
          {/* Asked, never assumed. A long hold short looks like a landing. */}
          <PrimaryButton onClick={onEnd}>End flight</PrimaryButton>
          <SecondaryButton onClick={onKeep}>Keep recording</SecondaryButton>
        </div>
      ) : (
        <SecondaryButton onClick={onEnd}>
          <Square className="size-4 fill-current" aria-hidden />
          End flight
        </SecondaryButton>
      )}
    </>
  );
}

/* ------------------------------------------------------------- complete */

function Complete({ session }: { session: FlightRecordingSession }) {
  const d = durations(session);
  const hours = ((d.trackedMs ?? 0) / 3_600_000).toFixed(1);
  return (
    <>
      <Panel>
        <PanelEyebrow icon={<Check className="size-3.5" aria-hidden />}>Flight complete</PanelEyebrow>
        <PanelHeadline>{hours} hr tracked</PanelHeadline>
        <p className="mt-1 text-[15px] text-panel-foreground-soft">
          {session.fixes.length > 0
            ? `${session.fixes.length} position fixes recorded`
            : "No track recorded — the flight is still yours to debrief"}
        </p>
      </Panel>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/debrief/new">Start debrief</PrimaryButton>
        <SecondaryButton href="/prototype/vector/flights">View flight</SecondaryButton>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- pieces */

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn("flex min-h-[52px] items-center justify-between gap-4 py-2.5", !last && "border-b border-hairline")}>
      <span className="text-[15px] text-foreground-faint">{label}</span>
      <span className="text-[17px] font-medium text-foreground">{value}</span>
    </div>
  );
}

function Choice({ label, selected, onClick, last = false }: { label: string; selected: boolean; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn("flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-2.5 text-left", !last && "border-b border-hairline")}
    >
      <span className="text-[17px] text-foreground">{label}</span>
      {selected ? <Check className="size-[18px] shrink-0 text-brand" strokeWidth={2.5} aria-hidden /> : null}
    </button>
  );
}
