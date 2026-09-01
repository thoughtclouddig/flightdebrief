/**
 * Derives which runway was used from a ground track.
 *
 * FR24's flight-summary carries no runway, and I ruled this out on the
 * assumption that a track per flight was prohibitively expensive. Measured, a
 * track costs 40 credits -- about a cent -- so the runway was always sitting
 * in data we could afford. It just had to be read out of the geometry.
 *
 * The method: an airplane on final is tracking the runway centerline, so the
 * direction it is moving in the last stretch before it reaches the field IS
 * the runway heading. Same in reverse for a departure.
 *
 * WHAT THIS CANNOT DO
 * Parallel runways. 4L and 4R have identical headings, so a track can say
 * "the 04 direction" and nothing more. Reporting them merged is honest;
 * splitting them by lateral offset would be a guess dressed as a measurement.
 */

import { bearingDeg, distanceNm, type LatLon, type TrackPoints } from "./airport-tracks";

/**
 * How close a point must be to count as part of the arrival or departure leg.
 *
 * Two miles: far enough out that the aircraft is established and tracking the
 * centerline, close enough that it is committed to this runway rather than
 * still maneuvering.
 */
const APPROACH_RADIUS_NM = 2;

/** Below this, the points are too scattered to be tracking anything. */
const MIN_LEG_POINTS = 3;

/**
 * How straight the leg has to be before we believe it.
 *
 * A base leg, a circling approach or a go-around all pass near the field
 * without ever settling onto a heading. Requiring the headings to agree
 * within this many degrees is what separates "lined up on a runway" from
 * "flew past the airport", and rejecting the ambiguous ones matters more than
 * classifying every track.
 */
const MAX_HEADING_SPREAD_DEG = 25;

export interface RunwayUse {
  /** Runway number as painted, e.g. "04", "22". Parallels are merged. */
  runway: string;
  arrivals: number;
  departures: number;
  total: number;
  share: number;
}

/** Smallest signed angle between two bearings, in degrees. */
function angleDiff(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

/** Circular mean of bearings. A plain average of 350 and 10 gives 180, which is backwards. */
function meanBearing(bearings: number[]): number {
  const x = bearings.reduce((n, b) => n + Math.cos((b * Math.PI) / 180), 0);
  const y = bearings.reduce((n, b) => n + Math.sin((b * Math.PI) / 180), 0);
  return (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360;
}

/**
 * True heading to the runway number painted on it.
 *
 * Runway numbers are MAGNETIC, and a track gives true bearings. At Falcon
 * Field the difference is about 10 degrees east, which is a whole runway
 * number -- skip this and every figure is confidently labeled with the wrong
 * runway.
 */
export function runwayNumber(trueHeading: number, magneticVariationDeg: number): string {
  const magnetic = (((trueHeading - magneticVariationDeg) % 360) + 360) % 360;
  const number = Math.round(magnetic / 10) || 36;
  return String(number).padStart(2, "0");
}

/**
 * The runway a single leg used, or null when the geometry does not support an
 * answer.
 *
 * `end` picks which end of the track to read: arrivals are established at the
 * finish, departures at the start.
 */
export function runwayFromTrack(
  points: TrackPoints,
  airport: LatLon,
  magneticVariationDeg: number,
  end: "arrival" | "departure",
  /** When the field's real runways are known, snap to them instead of rounding. */
  runwayIdents?: string[],
): string | null {
  const ordered = end === "arrival" ? [...points] : [...points].reverse();

  // Walk in from the far end and keep the run of points near the field. For
  // an arrival that is the approach; reversed, for a departure, the climb
  // out.
  const leg: [number, number][] = [];
  for (let i = ordered.length - 1; i >= 0; i--) {
    const [lon, lat] = ordered[i];
    if (distanceNm(airport, { lat, lon }) > APPROACH_RADIUS_NM) break;
    leg.unshift(ordered[i]);
  }
  if (leg.length < MIN_LEG_POINTS) return null;

  const bearings: number[] = [];
  for (let i = 1; i < leg.length; i++) {
    const [lon1, lat1] = leg[i - 1];
    const [lon2, lat2] = leg[i];
    // Consecutive points a few meters apart give a bearing that is mostly
    // GPS noise, so skip them rather than let them vote.
    if (distanceNm({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }) < 0.05) continue;
    bearings.push(bearingDeg({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }));
  }
  if (bearings.length < 2) return null;

  const mean = meanBearing(bearings);
  const spread = Math.max(...bearings.map((b) => angleDiff(b, mean)));
  // Not straight enough to be a runway alignment. A go-around, a circuit, or
  // an overflight. Reported as unknown rather than snapped to the nearest
  // runway, because a confident wrong answer is worse than none.
  if (spread > MAX_HEADING_SPREAD_DEG) return null;

  // A departure was read backwards, so the heading points the wrong way.
  const heading = end === "departure" ? (mean + 180) % 360 : mean;
  if (runwayIdents?.length) return snapToRunway(heading, runwayIdents);
  return runwayNumber(heading, magneticVariationDeg);
}

/**
 * Snap a measured heading to a runway the field actually has.
 *
 * This removes the need for a precise magnetic variation. Converting a true
 * bearing to a runway number needs the local variation, which we do not store
 * and which would be one more per-airport fact to get wrong. But a field's
 * runway identifiers are known -- Windsock returns them -- and they are far
 * apart: at a two-runway field the nearest candidate is unambiguous even if
 * the variation is ten degrees out.
 *
 * Returns null when nothing is within tolerance, which is the honest answer
 * for a track that lined up with no runway here.
 */
export function snapToRunway(trueHeading: number, runwayIdents: string[]): string | null {
  // "4L/22R" describes two directions; each end is its own candidate, and the
  // L/R suffix is dropped because parallels share a heading and cannot be
  // told apart from a track.
  const candidates = new Set<string>();
  for (const ident of runwayIdents) {
    for (const part of ident.split("/")) {
      const number = part.trim().match(/^(\d{1,2})/)?.[1];
      if (number) candidates.add(String(Number(number)).padStart(2, "0"));
    }
  }
  if (!candidates.size) return null;

  let best: string | null = null;
  let bestDiff = Infinity;
  for (const candidate of candidates) {
    const diff = angleDiff(trueHeading, Number(candidate) * 10);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  // Runway numbers are magnetic and this heading is true, so some slop is
  // expected -- but 30 degrees is not slop, it is a different runway.
  return bestDiff <= 30 ? best : null;
}

export interface RunwayTrack {
  points: TrackPoints;
  /** Local flights use both ends; a pure arrival or departure uses one. */
  kind: "local" | "arrival" | "departure";
}

export function summarizeRunways(
  tracks: RunwayTrack[],
  airport: LatLon,
  magneticVariationDeg: number,
  /** The field's actual runway identifiers. When given, headings snap to these. */
  runwayIdents?: string[],
): { runways: RunwayUse[]; classified: number; unclassified: number } {
  const counts = new Map<string, { arrivals: number; departures: number }>();
  let classified = 0;
  let unclassified = 0;

  const record = (runway: string | null, as: "arrivals" | "departures") => {
    if (!runway) {
      unclassified++;
      return;
    }
    const entry = counts.get(runway) ?? { arrivals: 0, departures: 0 };
    entry[as]++;
    counts.set(runway, entry);
    classified++;
  };

  for (const track of tracks) {
    // A local flight departed AND landed here, so it votes twice -- and can
    // legitimately vote for different runways if the wind shifted during the
    // lesson.
    if (track.kind === "local" || track.kind === "departure") {
      record(runwayFromTrack(track.points, airport, magneticVariationDeg, "departure", runwayIdents), "departures");
    }
    if (track.kind === "local" || track.kind === "arrival") {
      record(runwayFromTrack(track.points, airport, magneticVariationDeg, "arrival", runwayIdents), "arrivals");
    }
  }

  const runways: RunwayUse[] = [...counts.entries()]
    .map(([runway, { arrivals, departures }]) => ({
      runway,
      arrivals,
      departures,
      total: arrivals + departures,
      share: (arrivals + departures) / (classified || 1),
    }))
    .sort((a, b) => b.total - a.total || a.runway.localeCompare(b.runway));

  return { runways, classified, unclassified };
}
