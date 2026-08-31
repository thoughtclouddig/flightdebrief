import type { TrackPosition } from "@/lib/types";

/**
 * The evidence architecture for flight analysis.
 *
 * One idea holds this whole file together: AfterFlight combines four kinds of
 * statement that must never be mistaken for each other.
 *
 *   INSTRUCTOR   what a person explicitly said
 *   STUDENT      what the student explicitly reported
 *   FLIGHT_DATA  what was measured, or defensibly derived from measurement
 *   VECTOR       what AfterFlight infers from the above
 *   FAA_ACS      what the published standard says
 *
 * The classes stay distinct in the model, not just in the UI copy, because a
 * UI-only separation erodes the first time someone renders two of them in the
 * same list. Vector inference must never look measured; telemetry must never
 * look like judgment.
 *
 * The second idea is the capability model. ADS-B is not avionics. It reports
 * position, pressure altitude and groundspeed -- it does not report indicated
 * airspeed, pitch, bank, flap position or power. A product that says "you
 * crossed the threshold at 72 KIAS" from an ADS-B track is fabricating. So
 * capability is data, checked before a claim is rendered, rather than a rule
 * someone is expected to remember.
 */

/* --------------------------------------------------------------- sources */

export type EvidenceSource = "INSTRUCTOR" | "STUDENT" | "FLIGHT_DATA" | "VECTOR" | "FAA_ACS";

/** Where telemetry physically came from. Preserved even when never displayed. */
export type TelemetryProvider =
  | "FR24"
  | "GARMIN"
  | "FOREFLIGHT"
  | "STRATUS"
  | "SIMULATOR"
  | "MANUAL"
  | "OTHER";

/**
 * How much weight a derived statement can carry.
 *
 * MEASURED   the source reported this value
 * DERIVED    computed from measured values by a defensible rule (e.g. vertical
 *            rate from consecutive altitudes)
 * INFERRED   a judgement about what the numbers mean
 * UNCERTAIN  the data is too sparse or noisy to support a claim
 *
 * Not shown as a number. The product needs to know the difference so that
 * UNCERTAIN never becomes an instructional claim.
 */
export type Quality = "MEASURED" | "DERIVED" | "INFERRED" | "UNCERTAIN";

/* ---------------------------------------------------------- capabilities */

/**
 * What a given source can actually tell us.
 *
 * Every field defaults to false. Adding a richer source (a G1000 export, a
 * simulator log) means flipping the fields it genuinely provides -- and the UI
 * and Vector both read this rather than assuming.
 */
export interface FlightDataCapabilities {
  position: boolean;
  altitude: boolean;
  groundSpeed: boolean;
  verticalRate: boolean;
  heading: boolean;
  indicatedAirspeed: boolean;
  pitch: boolean;
  bank: boolean;
  engine: boolean;
  controls: boolean;
}

/**
 * ADS-B, as it actually is.
 *
 * Vertical rate is true because it is DERIVED from consecutive altitude
 * samples, and the derivation is honest -- but heading is false even though a
 * ground track exists, because ground track is not heading, and in the
 * crosswind this product is about, the difference is the entire lesson.
 */
export const FR24_CAPABILITIES: FlightDataCapabilities = {
  position: true,
  altitude: true,
  groundSpeed: true,
  verticalRate: true,
  heading: false,
  indicatedAirspeed: false,
  pitch: false,
  bank: false,
  engine: false,
  controls: false,
};

export const NO_CAPABILITIES: FlightDataCapabilities = {
  position: false,
  altitude: false,
  groundSpeed: false,
  verticalRate: false,
  heading: false,
  indicatedAirspeed: false,
  pitch: false,
  bank: false,
  engine: false,
  controls: false,
};

/* ------------------------------------------------------------- telemetry */

/**
 * One normalized sample.
 *
 * Absent fields are null, never zero and never guessed. A null vertical rate
 * means "we do not know", and every consumer has to handle that rather than
 * rendering a confident 0 fpm.
 */
export interface TelemetryPoint {
  /** Milliseconds since flight start. The single synchronization authority. */
  t: number;
  lat: number;
  lon: number;
  /** Feet. ADS-B reports pressure altitude, which is not AGL. */
  altitudeFt: number | null;
  /** Knots over the ground. NOT indicated airspeed. */
  groundSpeedKt: number | null;
  /** Feet per minute, derived from consecutive altitudes. */
  verticalRateFpm: number | null;
  /** Degrees. Ground track, not heading -- they differ in any wind. */
  trackDeg: number | null;
}

export interface FlightTelemetry {
  provider: TelemetryProvider;
  capabilities: FlightDataCapabilities;
  points: TelemetryPoint[];
  /** Total flight duration in ms, so a scrubber has a fixed domain. */
  durationMs: number;
}

/**
 * Normalize a stored track into the telemetry model.
 *
 * Vertical rate and ground track are computed here rather than at each call
 * site, and both are marked DERIVED by construction: a two-sample difference
 * over an ADS-B cadence is a real number with real noise, not an instrument
 * reading.
 */
export function normalizeTrack(track: TrackPosition[], provider: TelemetryProvider = "FR24"): FlightTelemetry {
  if (track.length === 0) {
    return { provider, capabilities: NO_CAPABILITIES, points: [], durationMs: 0 };
  }

  const t0 = new Date(track[0]!.timestamp).getTime();
  const points: TelemetryPoint[] = track.map((p, i) => {
    const t = new Date(p.timestamp).getTime() - t0;
    const prev = i > 0 ? track[i - 1] : null;

    let verticalRateFpm: number | null = null;
    if (prev && p.altitudeFt != null && prev.altitudeFt != null) {
      const dtMin = (t - (new Date(prev.timestamp).getTime() - t0)) / 60000;
      // Guard the divide: duplicated timestamps are common in ADS-B feeds and
      // would otherwise produce an infinite climb rate.
      verticalRateFpm = dtMin > 0 ? Math.round((p.altitudeFt - prev.altitudeFt) / dtMin) : null;
    }

    let trackDeg: number | null = null;
    if (prev) {
      const dLon = p.lon - prev.lon;
      const dLat = p.lat - prev.lat;
      if (dLon !== 0 || dLat !== 0) {
        trackDeg = Math.round(((Math.atan2(dLon, dLat) * 180) / Math.PI + 360) % 360);
      }
    }

    return {
      t,
      lat: p.lat,
      lon: p.lon,
      altitudeFt: p.altitudeFt ?? null,
      groundSpeedKt: p.groundSpeedKt ?? null,
      verticalRateFpm,
      trackDeg,
    };
  });

  return {
    provider,
    capabilities: provider === "FR24" ? FR24_CAPABILITIES : NO_CAPABILITIES,
    points,
    durationMs: points[points.length - 1]!.t,
  };
}

/** The sample nearest a scrub position. One lookup, shared by every widget. */
export function pointAt(telemetry: FlightTelemetry, t: number): TelemetryPoint | null {
  if (telemetry.points.length === 0) return null;
  let best = telemetry.points[0]!;
  let bestGap = Math.abs(best.t - t);
  for (const p of telemetry.points) {
    const gap = Math.abs(p.t - t);
    if (gap < bestGap) {
      best = p;
      bestGap = gap;
    }
  }
  return best;
}

/* -------------------------------------------------------------- segments */

export type SegmentType =
  | "DEPARTURE"
  | "CLIMB"
  | "CRUISE"
  | "DESCENT"
  | "TRAFFIC_PATTERN"
  | "APPROACH"
  | "LANDING"
  | "GO_AROUND"
  | "UNKNOWN";

export interface FlightSegment {
  id: string;
  type: SegmentType;
  /** Display name: "Approach 2", not "APPROACH". */
  label: string;
  startT: number;
  endT: number;
  startIndex: number;
  endIndex: number;
  /** 0-1. Preserved so uncertain segmentation is never shown as certain. */
  confidence: number;
}

/**
 * Segment a pattern flight into approaches.
 *
 * The rule is deliberately simple and stated rather than tuned: in the
 * pattern, each approach is a descent toward the runway, so a local altitude
 * maximum followed by a sustained descent to a local minimum is one attempt.
 * That is defensible from position and altitude alone, which is all ADS-B
 * gives us.
 *
 * What this does NOT attempt is classifying maneuvers, grading approaches, or
 * detecting go-arounds reliably -- a go-around and a touch-and-go look nearly
 * identical from above at ADS-B sample rates. Phase 1 covers the case with the
 * clearest training value: repeated attempts at the same thing in one lesson,
 * so a student can see what changed between them.
 *
 * Confidence is carried out of the function rather than thresholded inside it,
 * so the UI can decline to show a weak segmentation instead of this module
 * silently dropping it.
 */
export function segmentFlight(telemetry: FlightTelemetry): FlightSegment[] {
  const pts = telemetry.points;
  if (pts.length < 8 || !telemetry.capabilities.altitude) return [];

  const alt = pts.map((p) => p.altitudeFt ?? 0);
  const minAlt = Math.min(...alt);
  const maxAlt = Math.max(...alt);
  const span = maxAlt - minAlt;
  // A flight with no vertical structure has no approaches to find.
  if (span < 200) return [];

  const lowThreshold = minAlt + span * 0.3;
  const highThreshold = minAlt + span * 0.7;

  const segments: FlightSegment[] = [];
  let approachN = 0;
  let descentStart: number | null = null;
  let armed = false;

  for (let i = 1; i < pts.length; i++) {
    if (alt[i]! > highThreshold) {
      // Climbed back to pattern altitude: the next descent is a new attempt.
      armed = true;
      descentStart = i;
    }
    if (armed && alt[i]! < lowThreshold) {
      approachN += 1;
      const start = descentStart ?? Math.max(0, i - 10);
      segments.push({
        id: `approach-${approachN}`,
        type: "APPROACH",
        label: `Approach ${approachN}`,
        startT: pts[start]!.t,
        endT: pts[i]!.t,
        startIndex: start,
        endIndex: i,
        // More samples in the descent means a better-supported segment.
        confidence: Math.min(1, (i - start) / 12),
      });
      armed = false;
      descentStart = null;
    }
  }

  if (segments.length === 0) return [];

  // Bookend with departure and landing so the timeline covers the whole flight
  // rather than leaving unlabelled gaps the student has to interpret.
  const first = segments[0]!;
  const last = segments[segments.length - 1]!;
  return [
    {
      id: "departure",
      type: "DEPARTURE",
      label: "Takeoff",
      startT: pts[0]!.t,
      endT: first.startT,
      startIndex: 0,
      endIndex: first.startIndex,
      confidence: 0.9,
    },
    ...segments,
    {
      id: "landing",
      type: "LANDING",
      label: "Landing",
      startT: last.endT,
      endT: pts[pts.length - 1]!.t,
      startIndex: last.endIndex,
      endIndex: pts.length - 1,
      confidence: 0.9,
    },
  ];
}

/* --------------------------------------------------------------- anchors */

/**
 * How a piece of evidence attaches to the flight.
 *
 * EXACT_TIMESTAMP     said in the cockpit at a known moment
 * SEGMENT_ASSOCIATION said afterwards, about a segment
 *
 * The distinction is the point. "Approach 2 was where you kept chasing it" was
 * spoken on the ramp with the engine off. Pinning it to 10:42:18 would invent
 * a fact and put a quotation mark on a second that never happened. The UI says
 * "linked to Approach 2" for exactly this reason.
 */
export type AnchorKind = "EXACT_TIMESTAMP" | "SEGMENT_ASSOCIATION";

export interface EvidenceAnchor {
  kind: AnchorKind;
  /** Set for EXACT_TIMESTAMP. */
  t?: number;
  /** Set for SEGMENT_ASSOCIATION. */
  segmentId?: string;
}

/* ---------------------------------------------------------------- moments */

export type MomentType = "NEEDS_ATTENTION" | "IMPROVED" | "BEST_ATTEMPT" | "DECISION" | "NEUTRAL";

/**
 * A Flight Moment: where what was said, what the airplane did, and what it
 * means for training come together.
 *
 * Each evidence field is optional and separately attributed, so a moment with
 * only an instructor quote is legal, and a moment with only telemetry is legal,
 * and neither borrows the other's authority.
 */
export interface FlightMoment {
  id: string;
  segmentId: string;
  anchor: EvidenceAnchor;
  title: string;
  type: MomentType;
  /** Verbatim. Never paraphrased into Vector's voice. */
  instructorEvidence: { who: string; quote: string } | null;
  studentEvidence: { quote: string } | null;
  /**
   * Observations from telemetry. Phrased in the vocabulary the source
   * supports: groundspeed, not airspeed; ground track, not heading.
   */
  flightData: { label: string; value: string; quality: Quality }[];
  /** Clearly Vector's reading, always hedged when the data is partial. */
  vectorInference: string | null;
  acsArea: string | null;
  acsTask: string | null;
}

export function momentTone(type: MomentType): "attention" | "good" | "neutral" {
  if (type === "NEEDS_ATTENTION") return "attention";
  if (type === "IMPROVED" || type === "BEST_ATTEMPT") return "good";
  return "neutral";
}

/* -------------------------------------------------------------- summaries */

/**
 * Compare two segments using only what the data supports.
 *
 * Every string this returns is a relative comparison -- "settled earlier than",
 * "varied less than" -- never an absolute verdict. ADS-B cannot support
 * "met stabilized approach criteria", and saying so would be the single most
 * damaging kind of wrong this feature could be: confident, specific, and
 * about something the instructor is responsible for judging.
 */
export function compareSegments(
  telemetry: FlightTelemetry,
  a: FlightSegment,
  b: FlightSegment,
): { label: string; a: string; b: string }[] {
  const rows: { label: string; a: string; b: string }[] = [];
  const slice = (s: FlightSegment) => telemetry.points.slice(s.startIndex, s.endIndex + 1);

  const spread = (vals: (number | null)[]) => {
    const v = vals.filter((x): x is number => x != null);
    if (v.length < 2) return null;
    return Math.max(...v) - Math.min(...v);
  };

  if (telemetry.capabilities.verticalRate) {
    const sa = spread(slice(a).map((p) => p.verticalRateFpm));
    const sb = spread(slice(b).map((p) => p.verticalRateFpm));
    if (sa != null && sb != null) {
      rows.push({
        label: "Descent profile",
        a: `${Math.round(sa)} fpm of variation`,
        b: `${Math.round(sb)} fpm of variation`,
      });
    }
  }

  if (telemetry.capabilities.groundSpeed) {
    const sa = spread(slice(a).map((p) => p.groundSpeedKt));
    const sb = spread(slice(b).map((p) => p.groundSpeedKt));
    if (sa != null && sb != null) {
      rows.push({
        label: "Groundspeed",
        a: `${Math.round(sa)} kt of variation`,
        b: `${Math.round(sb)} kt of variation`,
      });
    }
  }

  const ta = spread(slice(a).map((p) => p.trackDeg));
  const tb = spread(slice(b).map((p) => p.trackDeg));
  if (ta != null && tb != null) {
    rows.push({
      label: "Ground track",
      a: `${Math.round(ta)}° of variation`,
      b: `${Math.round(tb)}° of variation`,
    });
  }

  return rows;
}

/** mm:ss from the flight clock. Replay shows elapsed, not wall time. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
