/**
 * Turns a pile of ground tracks into something a reader can act on.
 *
 * The map alone is decorative. Anyone looking at overlaid tracks can see that
 * the brightest spot is the airport, which they already knew, and the rest is
 * an attractive tangle. The finding is *where the flying goes once it leaves
 * the pattern* -- which sectors, how far out -- because that is the thing a
 * pilot arriving at an unfamiliar field cannot get from a chart and would
 * genuinely like to know before they get there.
 *
 * Position reports are treated as a time proxy. They arrive at a roughly
 * fixed cadence, so counting points in a sector approximates minutes spent
 * there, which is the quantity that matters: a lap through a practice area
 * and an hour of airwork in it should not count the same.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

/** Stored tracks are [lon, lat] pairs, GeoJSON order. */
export type TrackPoints = [number, number][];

/**
 * Inside this, a flight is in or near the pattern.
 *
 * Three miles rather than the two a pattern actually occupies, because the
 * question is "is this circuit work or is it going somewhere", and the answer
 * should not flip because a wide downwind clipped the boundary.
 */
export const PATTERN_RADIUS_NM = 3;

const COMPASS = [
  "north", "northeast", "east", "southeast",
  "south", "southwest", "west", "northwest",
] as const;

export type Sector = (typeof COMPASS)[number];

export interface SectorSummary {
  sector: Sector;
  /** Share of all off-airport position time, 0-1. */
  share: number;
  /** Distance band holding the middle of this sector's activity, in nautical miles. */
  innerNm: number;
  outerNm: number;
}

export interface TrackSummary {
  trackCount: number;
  /** Share of all position time within PATTERN_RADIUS_NM of the field. */
  patternShare: number;
  /** Busiest sectors beyond the pattern, most active first. */
  sectors: SectorSummary[];
  /** How far the typical local flight gets from the field, in nautical miles. */
  medianRangeNm: number;
}

const R_NM = 3440.065;
const toRad = (d: number) => (d * Math.PI) / 180;

export function distanceNm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDeg(from: LatLon, to: LatLon): number {
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function sectorOf(bearing: number): Sector {
  // Sectors are centred on the compass point rather than starting at it, so
  // "north" means 337.5-22.5 rather than 0-45. Otherwise every reading is
  // rotated half a sector from what the word means.
  const normalized = ((bearing % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % 8];
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[i];
}

export function summarizeTracks(tracks: TrackPoints[], airport: LatLon): TrackSummary {
  let inPattern = 0;
  let outside = 0;
  const bySector = new Map<Sector, number[]>();
  const rangePerTrack: number[] = [];

  for (const points of tracks) {
    let maxRange = 0;
    for (const [lon, lat] of points) {
      const d = distanceNm(airport, { lat, lon });
      maxRange = Math.max(maxRange, d);
      if (d <= PATTERN_RADIUS_NM) {
        inPattern++;
        continue;
      }
      outside++;
      const sector = sectorOf(bearingDeg(airport, { lat, lon }));
      const distances = bySector.get(sector) ?? [];
      distances.push(d);
      bySector.set(sector, distances);
    }
    if (points.length) rangePerTrack.push(maxRange);
  }

  const total = inPattern + outside;
  const sectors: SectorSummary[] = [...bySector.entries()]
    .map(([sector, distances]) => {
      const sorted = [...distances].sort((a, b) => a - b);
      return {
        sector,
        share: distances.length / (outside || 1),
        // The middle HALF of the sector's activity, not the middle 80%.
        // Wider percentiles produced bands like "10-51 nm", which is not a
        // practice area, it is most of a state -- a local flight can be a
        // round-trip cross-country, and a handful of those stretch the tail
        // until the band stops describing anywhere. The interquartile range
        // says where the flying actually concentrates.
        innerNm: Math.round(percentile(sorted, 0.25)),
        outerNm: Math.round(percentile(sorted, 0.75)),
      };
    })
    .sort((a, b) => b.share - a.share || a.sector.localeCompare(b.sector));

  const sortedRanges = [...rangePerTrack].sort((a, b) => a - b);

  return {
    trackCount: tracks.length,
    patternShare: total ? inPattern / total : 0,
    sectors,
    medianRangeNm: Math.round(percentile(sortedRanges, 0.5)),
  };
}

/**
 * The sentences printed above the map.
 *
 * Generated from the summary rather than written, so they cannot drift from
 * the figure they describe, and so they say nothing when the data does not
 * support saying it.
 */
export function describeTracks(summary: TrackSummary): string[] {
  if (!summary.trackCount) return [];
  const out: string[] = [];
  const top = summary.sectors.filter((s) => s.share >= 0.1).slice(0, 3);
  if (top.length) {
    out.push(
      `Head ${listPhrase(top.map((s) => s.sector))} and you are flying where everyone else from this field flies. That is where to expect training traffic, and where to look for a practice area with company in it.`,
    );
  }
  return out;
}

function listPhrase(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
