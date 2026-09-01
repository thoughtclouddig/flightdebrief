import { ACS_AREAS } from "@/lib/prototype/vector-data";
import { flightById } from "@/lib/prototype/flights";
import {
  normalizeTrack,
  segmentFlight,
  type FlightMoment,
  type FlightSegment,
  type FlightTelemetry,
} from "@/lib/prototype/telemetry";

/**
 * Flight analysis for one flight: telemetry, segments, and the moments where
 * instructor evidence, flight data and Vector's reading meet.
 *
 * Everything here is derived from the flight's stored track except the
 * instructor quotes, which are verbatim from Jake's debrief. That split is the
 * whole point of the feature: the numbers come from the airplane, the words
 * come from the person, and Vector is only allowed to talk about the
 * relationship between them.
 */
export interface FlightAnalysis {
  telemetry: FlightTelemetry;
  segments: FlightSegment[];
  moments: FlightMoment[];
}

/**
 * Moments for the Aug 29 lesson.
 *
 * Note the anchors. Jake said all of this on the ramp after shutdown, so every
 * one of these is a SEGMENT_ASSOCIATION -- "about Approach 2" -- rather than an
 * EXACT_TIMESTAMP. Pinning a post-flight remark to 10:42:18 would manufacture
 * a fact, and once the UI shows a second next to a quotation mark, nobody can
 * tell it from something actually said in the cockpit.
 *
 * The flight-data rows are phrased in the vocabulary ADS-B supports.
 * "Groundspeed", never "airspeed". Variation and consistency, never "stable"
 * or "met criteria" -- that is a judgement, and it belongs to Jake.
 */
function momentsFor(segments: FlightSegment[]): FlightMoment[] {
  const approach = (n: number) => segments.find((s) => s.id === `approach-${n}`);
  const out: FlightMoment[] = [];

  const a2 = approach(2);
  if (a2) {
    out.push({
      id: "m-a2",
      segmentId: a2.id,
      anchor: { kind: "SEGMENT_ASSOCIATION", segmentId: a2.id },
      title: "Approach 2",
      type: "NEEDS_ATTENTION",
      instructorEvidence: {
        who: "Jake",
        quote: "You were a little fast on two of the approaches. Get stabilized earlier.",
      },
      studentEvidence: null,
      flightData: [
        { label: "Descent profile", value: "More variation late in the approach", quality: "DERIVED" },
        { label: "Ground track", value: "Corrections continued close to the runway", quality: "DERIVED" },
      ],
      vectorInference:
        "This is where the approach was still changing close to the runway. Jake's comment appears to line up with the late corrections visible in the flight data.",
      acsArea: ACS_AREAS.landings,
      acsTask: "Crosswind Approach and Landing",
    });
  }

  const a3 = approach(3);
  if (a3) {
    out.push({
      id: "m-a3",
      segmentId: a3.id,
      anchor: { kind: "SEGMENT_ASSOCIATION", segmentId: a3.id },
      title: "Approach 3",
      type: "BEST_ATTEMPT",
      instructorEvidence: { who: "Jake", quote: "That was much better." },
      studentEvidence: null,
      flightData: [
        { label: "Descent profile", value: "Settled earlier than Approach 2", quality: "DERIVED" },
        { label: "Ground track", value: "Became consistent sooner", quality: "DERIVED" },
      ],
      vectorInference:
        "Based on the available flight data this appears to have been your most consistent attempt today — it settled earlier and needed fewer corrections near the runway.",
      acsArea: ACS_AREAS.landings,
      acsTask: "Crosswind Approach and Landing",
    });
  }

  const landing = segments.find((s) => s.type === "LANDING");
  if (landing) {
    out.push({
      id: "m-land",
      segmentId: landing.id,
      anchor: { kind: "SEGMENT_ASSOCIATION", segmentId: landing.id },
      title: "Short field",
      type: "IMPROVED",
      instructorEvidence: {
        who: "Jake",
        quote: "Short-field was pretty solid — you hit your aiming point on three of four.",
      },
      studentEvidence: { quote: "You felt short-field went well." },
      flightData: [],
      vectorInference: "You and Jake agree here. This is the one skill from today he didn't leave open.",
      acsArea: ACS_AREAS.landings,
      acsTask: "Short-Field Approach and Landing",
    });
  }

  return out;
}

/**
 * Analysis for a flight, or null when there is nothing to analyse.
 *
 * Returns null rather than an empty shell for a hand-entered flight: a screen
 * that offers Flight Analysis and then explains it has no data is worse than
 * not offering it, and the caller needs to know before rendering an entry
 * point.
 */
export function analysisFor(flightId: string): FlightAnalysis | null {
  const flight = flightById(flightId);
  if (!flight?.track || flight.track.length < 8) return null;

  const telemetry = normalizeTrack(flight.track, "FR24");
  const segments = segmentFlight(telemetry);
  if (segments.length === 0) return null;

  return { telemetry, segments, moments: flightId === "aug-29" ? momentsFor(segments) : [] };
}

/** Which segment a scrub position falls in. Drives every synchronized panel. */
export function segmentAt(segments: FlightSegment[], t: number): FlightSegment | null {
  return segments.find((s) => t >= s.startT && t <= s.endT) ?? segments[segments.length - 1] ?? null;
}

export function momentForSegment(moments: FlightMoment[], segmentId: string | null): FlightMoment | null {
  if (!segmentId) return null;
  return moments.find((m) => m.segmentId === segmentId) ?? null;
}
