import { describe, expect, it } from "vitest";
import { AIRPORTS, nearestKnownAirport } from "./geo";

describe("nearestKnownAirport", () => {
  it("resolves a position essentially on top of a known airport", () => {
    const kffz = AIRPORTS.KFFZ;
    expect(nearestKnownAirport(kffz.lat, kffz.lon)).toBe("KFFZ");
  });

  it("resolves a position a few hundred meters off the airport (a real GPS point, not the exact centroid)", () => {
    const kchd = AIRPORTS.KCHD;
    expect(nearestKnownAirport(kchd.lat + 0.005, kchd.lon + 0.005)).toBe("KCHD");
  });

  it("returns null for a position far from every known airport, rather than guessing the nearest one anyway", () => {
    // Roughly downtown Phoenix -- real distance, not adjacent to any of the 5 known fields.
    expect(nearestKnownAirport(33.4484, -112.074)).toBeNull();
  });

  it("returns null right at the edge of the threshold and beyond, never silently widening it", () => {
    const kdvt = AIRPORTS.KDVT;
    // ~0.03deg lat is roughly 3.3km at this latitude -- just past the 3km default.
    expect(nearestKnownAirport(kdvt.lat + 0.03, kdvt.lon)).toBeNull();
  });

  it("never resolves to a different airport just because it's the closest of the five when none are actually close", () => {
    // Nearest known airport to this point may well be KGYR, but real distance is
    // ~50km+ -- picking "closest of five" without a distance ceiling would be a
    // fabrication, not a real match.
    expect(nearestKnownAirport(33.9, -112.9)).toBeNull();
  });
});
