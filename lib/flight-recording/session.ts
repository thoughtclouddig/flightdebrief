import {
  DEFAULT_TRACKING_THRESHOLDS,
  type LandingState,
  type TrackingSnapshot,
  type TrackingThresholds,
} from "@/lib/flight-tracking/types";
import { stepLandingState, type LandingStateMachineState } from "@/lib/flight-tracking/landing-state-machine";

/**
 * Recording a flight from the phone.
 *
 * PLATFORM REALITY, STATED UP FRONT because the rest of this file only makes
 * sense with it: AfterFlight is a Next.js web app. There is no React Native,
 * Expo, or Capacitor layer, no PWA manifest and no service worker. The browser
 * Geolocation API stops or is aggressively throttled the moment the tab is
 * backgrounded or the screen locks -- iOS Safari suspends it outright -- and
 * no web API exists that grants Core Location background updates.
 *
 * So this module is honest about what it is: the domain layer, the session
 * clock, the persistence, the duration rules and the end-of-flight detection,
 * all of which are platform-independent and all of which the native app will
 * reuse unchanged. What it CANNOT do today is keep recording with the phone in
 * a flight bag. That single capability is the native build, and the UI says so
 * rather than promising a track it will not deliver.
 *
 * THE SESSION CLOCK. Start Flight establishes t0, and t0 is the authority for
 * everything: GPS samples, Flight Replay, and later cockpit audio, POV video
 * and avionics telemetry. That is the architectural reason to own recording at
 * all -- FR24 can give us a track, but it cannot give us a shared origin that
 * a microphone and a camera can also stamp against.
 */

export type RecordingSource = "PHONE_GPS";

/** Honest states for a fix, driven by the accuracy the device reports. */
export type FixQuality = "GOOD" | "FAIR" | "POOR" | "UNAVAILABLE";

/** Below this, a fix is not good enough to support an instructional claim. */
export const POOR_ACCURACY_M = 50;
const FAIR_ACCURACY_M = 20;

export function fixQuality(accuracyM: number | null): FixQuality {
  if (accuracyM == null) return "UNAVAILABLE";
  if (accuracyM <= FAIR_ACCURACY_M) return "GOOD";
  if (accuracyM <= POOR_ACCURACY_M) return "FAIR";
  return "POOR";
}

/**
 * One recorded fix.
 *
 * Only fields the device genuinely reports. `course` is course over ground,
 * not heading, and is named accordingly so nothing downstream can quietly
 * promote it. Nothing here is ever zero-filled: a device that does not report
 * altitude reports null, and null means unknown.
 */
export interface RecordedFix {
  /** Milliseconds since session t0. The shared timeline. */
  t: number;
  lat: number;
  lon: number;
  /** Meters. GPS altitude, not pressure altitude and not AGL. */
  altitudeM: number | null;
  /** Meters per second over the ground. Not indicated airspeed. Ever. */
  speedMps: number | null;
  /** Degrees, course over ground. Not heading -- they differ in any wind. */
  courseDeg: number | null;
  accuracyM: number | null;
  altitudeAccuracyM: number | null;
  quality: FixQuality;
}

export interface FlightRecordingSession {
  id: string;
  /** Epoch ms. Every fix's `t` is relative to this. */
  t0: number;
  source: RecordingSource;
  aircraftType: string;
  tailNumber: string;
  instructor: string | null;
  lesson: string | null;
  fixes: RecordedFix[];
  landing: LandingStateMachineState;
  endedAt: number | null;
}

export function startSession(opts: {
  id: string;
  t0: number;
  aircraftType: string;
  tailNumber: string;
  instructor: string | null;
  lesson: string | null;
}): FlightRecordingSession {
  return {
    id: opts.id,
    t0: opts.t0,
    source: "PHONE_GPS",
    aircraftType: opts.aircraftType,
    tailNumber: opts.tailNumber,
    instructor: opts.instructor,
    lesson: opts.lesson,
    fixes: [],
    landing: { state: "unknown", possibleLandingSince: null },
    endedAt: null,
  };
}

/**
 * Fold a browser GeolocationPosition into the session.
 *
 * Rejects a fix whose timestamp is not after the last one. Position callbacks
 * can fire out of order and can repeat, and a track that goes backwards in
 * time breaks every downstream assumption -- the scrubber, the segmenter and
 * the vertical-rate derivation all assume monotonic t.
 */
export function addFix(
  session: FlightRecordingSession,
  position: {
    timestamp: number;
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      speed: number | null;
      heading: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
    };
  },
): FlightRecordingSession {
  const t = position.timestamp - session.t0;
  const last = session.fixes[session.fixes.length - 1];
  if (last && t <= last.t) return session;

  const accuracyM = position.coords.accuracy;
  const fix: RecordedFix = {
    t,
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    altitudeM: position.coords.altitude,
    speedMps: position.coords.speed,
    // The web API calls it `heading`; it is course over ground. Renamed here
    // so the misnomer cannot travel any further into the product.
    courseDeg: position.coords.heading,
    accuracyM,
    altitudeAccuracyM: position.coords.altitudeAccuracy,
    quality: fixQuality(accuracyM),
  };

  const fixes = [...session.fixes, fix];
  return { ...session, fixes, landing: stepLanding(session, fix) };
}

const MPS_TO_KT = 1.94384;
const M_TO_FT = 3.28084;

/** Great-circle distance in nautical miles. Small enough not to need a library. */
function nmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 3440.065 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Run the shipped ADS-B landing machine against a phone fix.
 *
 * Deliberate reuse: the state machine in lib/flight-tracking is already
 * written and tested, and its logic -- slow, then slow for a sustained period,
 * with a speed increase meaning touch-and-go rather than landing -- is about
 * motion, not about where the position came from. Writing a second one for
 * phone GPS would be two behaviors to keep in agreement.
 *
 * A POOR fix is skipped rather than fed in. A bad GPS sample reads as near-zero
 * groundspeed, which is indistinguishable from having landed.
 */
function stepLanding(session: FlightRecordingSession, fix: RecordedFix): LandingStateMachineState {
  if (fix.quality === "POOR" || fix.quality === "UNAVAILABLE" || fix.speedMps == null) return session.landing;

  const origin = session.fixes[0] ?? null;

  const snapshot: TrackingSnapshot = {
    providerFlightId: session.id,
    tailNumber: session.tailNumber,
    lat: fix.lat,
    lon: fix.lon,
    altitudeFt: fix.altitudeM == null ? 0 : fix.altitudeM * M_TO_FT,
    groundSpeedKt: fix.speedMps * MPS_TO_KT,
    timestamp: new Date(session.t0 + fix.t).toISOString(),
    // The machine requires a distance-from-airport, and a phone has no airport
    // database. Rather than passing a fake zero, this supplies the distance
    // from where the session STARTED -- which for pattern work is the same
    // airport, and is genuinely computable from the fixes we have.
    //
    // The consequence is stated rather than hidden: a landing away from the
    // departure point will not trigger the prompt. That is the correct failure
    // -- silence, not a wrong guess -- and END FLIGHT is always available.
    nearestAirport: null,
    distanceFromAirportNm: origin ? nmBetween(origin, fix) : null,
  };
  return stepLandingState(session.landing, snapshot, DEFAULT_TRACKING_THRESHOLDS).state;
}

export function landingState(session: FlightRecordingSession): LandingState {
  return session.landing.state;
}

/**
 * Whether to ask "looks like you're down?".
 *
 * Asked, never assumed. One weak signal must not end a flight -- a long hold
 * short reads exactly like a landing -- so the UI offers END FLIGHT and KEEP
 * RECORDING rather than stopping on the app's own authority.
 */
export function looksLanded(session: FlightRecordingSession): boolean {
  return session.landing.state === "on_ground_confirmed" || session.landing.state === "flight_complete";
}

/* -------------------------------------------------------------- durations */

/**
 * Three different numbers that are all tempting to call "flight time".
 *
 * sessionMs   Start Flight to End Flight. Includes preflight, taxi, and the
 *             five minutes the phone sat recording while the CFI talked.
 * airborneMs  first movement above the ground-speed threshold to the last.
 *             The closest honest analogue to flight time.
 * trackedMs   what feeds Tracked Hours. Airborne when we can determine it,
 *             session otherwise, and never presented as Hobbs or logbook time.
 *
 * Collapsing these would inflate a student's hours by whatever fraction of the
 * session was spent on the ground, which is exactly the sort of quiet error
 * that destroys trust in every other number on the screen.
 */
export interface Durations {
  sessionMs: number;
  airborneMs: number | null;
  trackedMs: number;
}

export function durations(session: FlightRecordingSession, now = Date.now()): Durations {
  const end = session.endedAt ?? now;
  const sessionMs = Math.max(0, end - session.t0);

  const movingThresholdMps = DEFAULT_TRACKING_THRESHOLDS.groundSpeedThresholdKt / MPS_TO_KT;
  const moving = session.fixes.filter(
    (f) => f.speedMps != null && f.speedMps > movingThresholdMps && f.quality !== "POOR",
  );
  const airborneMs =
    moving.length >= 2 ? moving[moving.length - 1]!.t - moving[0]!.t : null;

  return { sessionMs, airborneMs, trackedMs: airborneMs ?? sessionMs };
}

/* ----------------------------------------------------- into the telemetry */

/**
 * Normalize into the shape the existing telemetry layer already consumes.
 *
 * The whole point: Flight Replay, segmentation, moments and Compare Attempts
 * work on phone-recorded flights without a second architecture, because the
 * output is the same `TrackPosition[]` an FR24 track produces. Units convert
 * here and nowhere else -- meters and m/s are the device's vocabulary, feet
 * and knots are aviation's.
 */
export function toTrackPositions(session: FlightRecordingSession) {
  return session.fixes
    // A poor fix would put a spurious corner in the track and could fabricate
    // a segment boundary. Dropped rather than smoothed: inventing a plausible
    // position is worse than having fewer of them.
    .filter((f) => f.quality === "GOOD" || f.quality === "FAIR")
    .map((f) => ({
      lat: f.lat,
      lon: f.lon,
      altitudeFt: f.altitudeM == null ? undefined : Math.round(f.altitudeM * M_TO_FT),
      groundSpeedKt: f.speedMps == null ? undefined : Math.round(f.speedMps * MPS_TO_KT),
      timestamp: new Date(session.t0 + f.t).toISOString(),
    }));
}

/* -------------------------------------------------------------- FR24 merge */

/**
 * What an FR24 match may contribute to a phone-recorded flight.
 *
 * Enrichment only. The phone's track is higher-frequency and already stamped
 * against t0, so ADS-B never overwrites it -- it fills fields the phone cannot
 * know (the tail number the aircraft actually squawked, the airport
 * identifiers) and confirms the ones it can. Field-specific, not a blanket
 * priority: FR24 is better at identity, the phone is better at position.
 */
export interface Enrichment {
  departureAirport: string | null;
  arrivalAirport: string | null;
  fr24FlightId: string | null;
}

export function mergeEnrichment(
  recorded: { departureAirport: string | null; arrivalAirport: string | null; fr24FlightId: string | null },
  fr24: Enrichment,
) {
  return {
    // Only fills gaps. A value the phone session already established stands.
    departureAirport: recorded.departureAirport ?? fr24.departureAirport,
    arrivalAirport: recorded.arrivalAirport ?? fr24.arrivalAirport,
    fr24FlightId: recorded.fr24FlightId ?? fr24.fr24FlightId,
  };
}

export { DEFAULT_TRACKING_THRESHOLDS };
export type { TrackingThresholds };
