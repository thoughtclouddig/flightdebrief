import type { TrackPosition } from "@/lib/types";

export const AIRPORTS: Record<string, { name: string; lat: number; lon: number }> = {
  KFFZ: { name: "Falcon Field", lat: 33.4634, lon: -111.728 },
  KCHD: { name: "Chandler Municipal", lat: 33.2698, lon: -111.8112 },
  KSDL: { name: "Scottsdale", lat: 33.6229, lon: -111.9105 },
  KDVT: { name: "Phoenix Deer Valley", lat: 33.6883, lon: -112.0827 },
  KGYR: { name: "Phoenix Goodyear", lat: 33.4227, lon: -112.375 },
};

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface Waypoint {
  lat: number;
  lon: number;
  alt: number;
  speed: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Generates a believable closed traffic-pattern loop around an airport for
 * demo purposes. Real ADS-B pattern tracks are mostly STRAIGHT legs (an
 * aircraft flies level on upwind/downwind/base) connected by short, tight
 * curved turns at each corner -- not one continuous smooth blob. This builds
 * exactly that: straight legs with a gentle organic wobble, rounded corners
 * only where the aircraft actually banks and turns.
 */
export function generatePatternTrack(
  airportCode: string,
  opts: { startTime: Date; durationMinutes: number; laps?: number; seed?: number },
): TrackPosition[] {
  const airport = AIRPORTS[airportCode] ?? AIRPORTS.KFFZ;
  const rand = seededRandom(opts.seed ?? hashString(airportCode + opts.startTime.toISOString()));
  const laps = opts.laps ?? 4;

  // A real rectangular traffic pattern: three clean, axis-aligned sides
  // (upwind / crosswind / downwind), with base+final cutting back to the
  // runway as a shorter diagonal -- exactly how it looks from above.
  const legOffsets = [
    { dLat: 0.0, dLon: 0.0, alt: 1200, speed: 65 }, // threshold / takeoff roll
    { dLat: 0.02, dLon: 0.0, alt: 2600, speed: 95 }, // upwind
    { dLat: 0.02, dLon: 0.014, alt: 2600, speed: 95 }, // crosswind
    { dLat: 0.0, dLon: 0.014, alt: 2600, speed: 90 }, // downwind
    { dLat: -0.004, dLon: 0.006, alt: 1600, speed: 80 }, // base
    { dLat: 0.0, dLon: 0.0, alt: 1000, speed: 70 }, // final
  ];

  // One waypoint (pattern corner) per leg per lap, each nudged slightly so
  // repeated laps don't trace an identical rectangle.
  const waypoints: Waypoint[] = [];
  for (let lap = 0; lap < laps; lap++) {
    for (const leg of legOffsets) {
      waypoints.push({
        lat: airport.lat + leg.dLat + (rand() - 0.5) * 0.0007,
        lon: airport.lon + leg.dLon + (rand() - 0.5) * 0.0007,
        alt: leg.alt,
        speed: leg.speed,
      });
    }
  }

  const n = waypoints.length;
  const cornerFraction = 0.16; // fraction of each leg spent turning at its far corner
  const straightSamples = 9;
  const turnSamples = 7;
  const samplesPerLeg = straightSamples + turnSamples;
  const totalSamples = n * samplesPerLeg;
  const msPerSample = (opts.durationMinutes * 60 * 1000) / totalSamples;
  const wobbleAmplitude = 0.00004; // gentle organic waver along an otherwise-straight leg
  const noiseAmplitude = 0.00002; // fine per-point GPS noise

  const points: TrackPosition[] = [];
  let t = opts.startTime.getTime();

  for (let i = 0; i < n; i++) {
    const prev = waypoints[(i - 1 + n) % n];
    const curr = waypoints[i];
    const next = waypoints[(i + 1) % n];

    // This leg runs from just-past-the-previous-corner to just-before-this-corner.
    const legStart = { lat: lerp(prev.lat, curr.lat, cornerFraction), lon: lerp(prev.lon, curr.lon, cornerFraction) };
    const legEnd = { lat: lerp(curr.lat, next.lat, 0), lon: lerp(curr.lon, next.lon, 0) }; // == curr, kept for clarity
    const cornerOut = { lat: lerp(curr.lat, next.lat, cornerFraction), lon: lerp(curr.lon, next.lon, cornerFraction) };

    // Perpendicular direction to this leg, for a smooth sinusoidal wobble (not per-point static).
    const dLat = legEnd.lat - legStart.lat;
    const dLon = legEnd.lon - legStart.lon;
    const legLength = Math.hypot(dLat, dLon) || 1;
    const perpLat = -dLon / legLength;
    const perpLon = dLat / legLength;
    const wobblePhase = rand() * Math.PI * 2;
    const wobbleCycles = 0.6 + rand() * 0.5;

    // Straight portion of the leg.
    for (let s = 0; s < straightSamples; s++) {
      const frac = s / straightSamples;
      const wobble = Math.sin(frac * Math.PI * wobbleCycles + wobblePhase) * wobbleAmplitude;
      const lat = lerp(legStart.lat, legEnd.lat, frac) + perpLat * wobble + (rand() - 0.5) * noiseAmplitude;
      const lon = lerp(legStart.lon, legEnd.lon, frac) + perpLon * wobble + (rand() - 0.5) * noiseAmplitude;
      const alt = lerp(prev.alt, curr.alt, frac);
      const speed = lerp(prev.speed, curr.speed, frac);
      points.push({
        lat,
        lon,
        altitudeFt: Math.round(alt + (rand() - 0.5) * 30),
        groundSpeedKt: Math.round(speed + (rand() - 0.5) * 3),
        timestamp: new Date(t).toISOString(),
      });
      t += msPerSample;
    }

    // Curved turn through the corner (quadratic bezier: legEnd -> curr as control -> cornerOut).
    for (let s = 0; s <= turnSamples; s++) {
      const frac = s / turnSamples;
      const inv = 1 - frac;
      const lat = inv * inv * legEnd.lat + 2 * inv * frac * curr.lat + frac * frac * cornerOut.lat;
      const lon = inv * inv * legEnd.lon + 2 * inv * frac * curr.lon + frac * frac * cornerOut.lon;
      const alt = lerp(curr.alt, next.alt, frac * cornerFraction);
      const speed = lerp(curr.speed, next.speed, frac * cornerFraction);
      points.push({
        lat: lat + (rand() - 0.5) * noiseAmplitude,
        lon: lon + (rand() - 0.5) * noiseAmplitude,
        altitudeFt: Math.round(alt + (rand() - 0.5) * 30),
        groundSpeedKt: Math.round(speed + (rand() - 0.5) * 3),
        timestamp: new Date(t).toISOString(),
      });
      t += msPerSample;
    }
  }

  return points;
}
