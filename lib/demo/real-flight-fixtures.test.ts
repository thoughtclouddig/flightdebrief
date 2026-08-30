import { describe, it, expect } from "vitest";
import { REAL_DEMO_FLIGHTS, completeDemoFlights, isCompleteTrack } from "./real-flight-fixtures";

describe("isCompleteTrack", () => {
  it("rejects a track that stops on final", () => {
    // ADS-B coverage ends a mile out, so the track stops at approach speed
    // several hundred feet up. Drawn on a map, that is an aeroplane ending in
    // a neighbourhood -- which is exactly how it looked on the demo.
    expect(
      isCompleteTrack({
        tailNumber: "N0TEST",
        aircraftType: "P28A",
        departureAirport: "KFFZ",
        arrivalAirport: "KNYL",
        takeoffIso: "2026-08-10T19:15:07Z",
        durationMinutes: 136,
        track: Array.from({ length: 500 }, () => ({ lat: 33, lon: -111, altitudeFt: 475, groundSpeedKt: 75 })),
      }),
    ).toBe(false);
  });

  it("accepts a track that starts and ends at taxi speed", () => {
    expect(
      isCompleteTrack({
        tailNumber: "N0TEST",
        aircraftType: "P28A",
        departureAirport: "KFFZ",
        arrivalAirport: "KFFZ",
        takeoffIso: "2026-08-10T19:15:07Z",
        durationMinutes: 60,
        track: Array.from({ length: 500 }, () => ({ lat: 33, lon: -111, altitudeFt: 0, groundSpeedKt: 2 })),
      }),
    ).toBe(true);
  });
});

describe("completeDemoFlights", () => {
  it("filters the shipped fixtures down to usable ones", () => {
    const complete = completeDemoFlights();
    expect(complete.length).toBeGreaterThan(0);
    expect(complete.length).toBeLessThan(REAL_DEMO_FLIGHTS.length);
  });

  it("leaves nothing that ends airborne", () => {
    for (const flight of completeDemoFlights()) {
      const last = flight.track[flight.track.length - 1];
      expect(last.groundSpeedKt ?? 999).toBeLessThan(40);
    }
  });
});
