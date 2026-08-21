import { describe, expect, it } from "vitest";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import type { TrackPosition } from "@/lib/types";

function point(index: number, lat = 33 + index / 10_000): TrackPosition {
  return {
    lat,
    lon: -111 + Math.sin(index / 5) / 1_000,
    timestamp: new Date(1_700_000_000_000 + index * 1_000).toISOString(),
  };
}

describe("simplifyTrackForDisplay", () => {
  it("keeps endpoints and caps large display tracks without mutating the flight track", () => {
    const track = Array.from({ length: 2_000 }, (_, index) => point(index));
    const original = structuredClone(track);

    const displayTrack = simplifyTrackForDisplay(track, 120);

    expect(displayTrack!.length).toBeLessThanOrEqual(120);
    expect(displayTrack!.length).toBeLessThan(track.length);
    expect(displayTrack?.[0]).toEqual(track[0]);
    expect(displayTrack?.at(-1)).toEqual(track.at(-1));
    expect(track).toEqual(original);
  });

  it("does not treat non-finite coordinates as a usable route", () => {
    const displayTrack = simplifyTrackForDisplay(
      [
        { lat: Number.NaN, lon: -111, timestamp: "2026-01-01T00:00:00.000Z" },
        { lat: 33, lon: Number.POSITIVE_INFINITY, timestamp: "2026-01-01T00:01:00.000Z" },
        { lat: 91, lon: -111, timestamp: "2026-01-01T00:02:00.000Z" },
      ],
      120,
    );

    expect(displayTrack).toEqual([]);
  });
});