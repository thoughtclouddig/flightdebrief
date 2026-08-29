import { describe, it, expect } from "vitest";
import {
  bearingDeg,
  describeTracks,
  distanceNm,
  PATTERN_RADIUS_NM,
  sectorOf,
  summarizeTracks,
  type TrackPoints,
} from "./airport-tracks";

const KFFZ = { lat: 33.4608, lon: -111.7283 };

/** A point n nautical miles from KFFZ on the given true bearing, as [lon, lat]. */
function offset(nm: number, bearing: number): [number, number] {
  const latPerNm = 1 / 60;
  const rad = (bearing * Math.PI) / 180;
  const lat = KFFZ.lat + nm * latPerNm * Math.cos(rad);
  const lon = KFFZ.lon + (nm * latPerNm * Math.sin(rad)) / Math.cos((KFFZ.lat * Math.PI) / 180);
  return [lon, lat];
}

describe("geometry", () => {
  it("measures distance in nautical miles", () => {
    expect(distanceNm(KFFZ, { lat: KFFZ.lat + 1 / 60, lon: KFFZ.lon })).toBeCloseTo(1, 1);
  });

  it("reads bearings clockwise from north", () => {
    expect(bearingDeg(KFFZ, { lat: KFFZ.lat + 1, lon: KFFZ.lon })).toBeCloseTo(0, 0);
    expect(bearingDeg(KFFZ, { lat: KFFZ.lat, lon: KFFZ.lon + 1 })).toBeCloseTo(90, 0);
  });
});

describe("sectorOf", () => {
  it("centres sectors on the compass point rather than starting at it", () => {
    // 10 degrees is north by any ordinary reading. A sector starting at 0
    // would call it northeast, which is half a sector wrong everywhere.
    expect(sectorOf(10)).toBe("north");
    expect(sectorOf(350)).toBe("north");
    expect(sectorOf(45)).toBe("northeast");
    expect(sectorOf(90)).toBe("east");
    expect(sectorOf(270)).toBe("west");
  });

  it("handles bearings outside 0-360", () => {
    expect(sectorOf(-90)).toBe("west");
    expect(sectorOf(450)).toBe("east");
  });
});

describe("summarizeTracks", () => {
  it("says nothing about an empty sample", () => {
    const summary = summarizeTracks([], KFFZ);
    expect(summary.trackCount).toBe(0);
    expect(summary.patternShare).toBe(0);
    expect(summary.sectors).toEqual([]);
    expect(describeTracks(summary)).toEqual([]);
  });

  it("separates pattern time from time spent away from the field", () => {
    const track: TrackPoints = [offset(1, 0), offset(2, 0), offset(10, 90), offset(12, 90)];
    const summary = summarizeTracks([track], KFFZ);
    expect(summary.patternShare).toBe(0.5);
  });

  it("attributes off-airport time to the right sector", () => {
    const east: TrackPoints = [offset(8, 90), offset(10, 90), offset(12, 90)];
    const north: TrackPoints = [offset(9, 0)];
    const summary = summarizeTracks([east, north], KFFZ);
    expect(summary.sectors[0].sector).toBe("east");
    expect(summary.sectors[0].share).toBeCloseTo(0.75, 2);
    expect(summary.sectors[1].sector).toBe("north");
  });

  it("does not let long round trips set the distance band", () => {
    // Most of the flying is 8-10nm out; a few local flights are round-trip
    // cross-countries reaching 60. The band should say where the flying
    // concentrates, not span everything that happened.
    const points: TrackPoints = [
      ...Array.from({ length: 16 }, (_, i) => offset(8 + (i % 3), 90)),
      offset(55, 90),
      offset(60, 90),
      offset(58, 90),
      offset(62, 90),
    ];
    const summary = summarizeTracks([points], KFFZ);
    expect(summary.sectors[0].outerNm).toBeLessThan(15);
  });

  it("reports the median range across flights, not across points", () => {
    // Two flights: one stays close, one goes far. A point-weighted median
    // would be dragged by whichever flight reported more positions.
    const near: TrackPoints = Array.from({ length: 50 }, () => offset(4, 0));
    const far: TrackPoints = [offset(20, 0)];
    const summary = summarizeTracks([near, far], KFFZ);
    expect(summary.medianRangeNm).toBeGreaterThanOrEqual(4);
    expect(summary.medianRangeNm).toBeLessThanOrEqual(20);
  });

  it("puts the pattern boundary where it says it is", () => {
    // Just inside and just outside rather than exactly on it: the test's own
    // offset helper is a flat approximation, so a point built at exactly
    // 3.0 nm lands a hair either side and would make this assert the
    // helper's precision rather than the boundary.
    expect(summarizeTracks([[offset(PATTERN_RADIUS_NM - 0.1, 0)]], KFFZ).patternShare).toBe(1);
    expect(summarizeTracks([[offset(PATTERN_RADIUS_NM + 0.1, 0)]], KFFZ).patternShare).toBe(0);
  });
});

describe("describeTracks", () => {
  it("names the busiest sectors with their distance band", () => {
    const east: TrackPoints = Array.from({ length: 20 }, (_, i) => offset(8 + (i % 5), 90));
    const summary = summarizeTracks([east], KFFZ);
    const text = describeTracks(summary).join(" ");
    expect(text).toContain("east");
  });

  it("stays quiet about sectors too thin to be a finding", () => {
    // 19 points east, 1 north. The north sector is 5% and should not be
    // reported as somewhere people go.
    const track: TrackPoints = [...Array.from({ length: 19 }, () => offset(9, 90)), offset(9, 0)];
    const text = describeTracks(summarizeTracks([track], KFFZ)).join(" ");
    expect(text).toContain("east");
    expect(text).not.toContain("north");
  });
});
