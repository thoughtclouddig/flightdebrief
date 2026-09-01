import { describe, expect, it } from "vitest";
import {
  addFix,
  durations,
  fixQuality,
  landingState,
  looksLanded,
  mergeEnrichment,
  startSession,
  toTrackPositions,
} from "@/lib/flight-recording/session";

const T0 = Date.UTC(2026, 7, 29, 20, 0, 0);

function session() {
  return startSession({
    id: "s1",
    t0: T0,
    aircraftType: "C172S",
    tailNumber: "N4521P",
    instructor: "Jake Alvarez",
    lesson: "Crosswind + Short Field",
  });
}

function pos(secs: number, over: Partial<{ speed: number | null; altitude: number | null; accuracy: number | null }> = {}) {
  return {
    timestamp: T0 + secs * 1000,
    coords: {
      latitude: 37.51,
      longitude: -122.25,
      altitude: over.altitude === undefined ? 300 : over.altitude,
      speed: over.speed === undefined ? 40 : over.speed,
      heading: 270,
      accuracy: over.accuracy === undefined ? 8 : over.accuracy,
      altitudeAccuracy: 12,
    },
  };
}

describe("the session clock", () => {
  it("stamps every fix relative to t0, not wall time", () => {
    let s = session();
    s = addFix(s, pos(30));
    expect(s.fixes[0]!.t).toBe(30_000);
  });

  it("rejects a fix that is not after the last one", () => {
    // Position callbacks repeat and arrive out of order. A track that goes
    // backwards breaks the scrubber, the segmenter and vertical rate.
    let s = session();
    s = addFix(s, pos(10));
    s = addFix(s, pos(10));
    s = addFix(s, pos(5));
    expect(s.fixes).toHaveLength(1);
  });
});

describe("no fabricated values", () => {
  it("keeps an unreported altitude or speed null rather than zero", () => {
    let s = session();
    s = addFix(s, pos(1, { altitude: null, speed: null }));
    expect(s.fixes[0]!.altitudeM).toBeNull();
    expect(s.fixes[0]!.speedMps).toBeNull();
  });

  it("records course over ground, never heading", () => {
    let s = session();
    s = addFix(s, pos(1));
    // The web API misnames it. If a `heading` key ever appears on a fix, the
    // misnomer has escaped into the product.
    expect(Object.keys(s.fixes[0]!)).toContain("courseDeg");
    expect(Object.keys(s.fixes[0]!)).not.toContain("heading");
  });

  it("converts groundspeed to knots and never labels it airspeed", () => {
    let s = session();
    s = addFix(s, pos(1, { speed: 40 }));
    const [p] = toTrackPositions(s);
    expect(p!.groundSpeedKt).toBe(78);
    expect(Object.keys(p!)).not.toContain("indicatedAirspeedKt");
  });
});

describe("fix quality", () => {
  it("grades accuracy honestly and calls a missing value unavailable", () => {
    expect(fixQuality(8)).toBe("GOOD");
    expect(fixQuality(35)).toBe("FAIR");
    expect(fixQuality(120)).toBe("POOR");
    expect(fixQuality(null)).toBe("UNAVAILABLE");
  });

  it("drops poor fixes from the track rather than smoothing them", () => {
    let s = session();
    s = addFix(s, pos(1, { accuracy: 5 }));
    s = addFix(s, pos(2, { accuracy: 400 }));
    expect(s.fixes).toHaveLength(2);
    // Inventing a plausible position is worse than having fewer of them.
    expect(toTrackPositions(s)).toHaveLength(1);
  });

  it("does not let a poor fix drive landing detection", () => {
    // A bad sample reads as near-zero groundspeed, which is indistinguishable
    // from having landed.
    let s = session();
    for (let i = 1; i <= 5; i++) s = addFix(s, pos(i, { speed: 45 }));
    const airborne = landingState(s);
    for (let i = 6; i <= 20; i++) s = addFix(s, pos(i, { speed: 0, accuracy: 500 }));
    expect(landingState(s)).toBe(airborne);
    expect(looksLanded(s)).toBe(false);
  });
});

describe("landing detection", () => {
  it("does not confirm a landing from one slow sample", () => {
    let s = session();
    for (let i = 1; i <= 5; i++) s = addFix(s, pos(i, { speed: 45 }));
    s = addFix(s, pos(6, { speed: 0 }));
    expect(looksLanded(s)).toBe(false);
  });

  it("confirms only after sustained time on the ground", () => {
    let s = session();
    for (let i = 1; i <= 5; i++) s = addFix(s, pos(i, { speed: 45 }));
    for (let i = 10; i <= 400; i += 10) s = addFix(s, pos(i, { speed: 0 }));
    expect(looksLanded(s)).toBe(true);
  });

  it("treats a speed increase as a touch-and-go, not a landing", () => {
    let s = session();
    for (let i = 1; i <= 5; i++) s = addFix(s, pos(i, { speed: 45 }));
    s = addFix(s, pos(6, { speed: 0 }));
    s = addFix(s, pos(20, { speed: 50 }));
    expect(landingState(s)).toBe("airborne");
  });
});

describe("durations", () => {
  it("separates session time from airborne time", () => {
    let s = session();
    // Ten minutes of preflight on the ground, then four minutes moving.
    for (let i = 0; i < 600; i += 60) s = addFix(s, pos(i, { speed: 0 }));
    for (let i = 600; i <= 840; i += 60) s = addFix(s, pos(i, { speed: 45 }));
    const d = durations({ ...s, endedAt: T0 + 900_000 });
    expect(d.sessionMs).toBe(900_000);
    expect(d.airborneMs).toBe(240_000);
    // Tracked hours must not bill the student for taxi and preflight.
    expect(d.trackedMs).toBe(240_000);
  });

  it("falls back to session time when nothing moved", () => {
    let s = session();
    s = addFix(s, pos(1, { speed: 0 }));
    const d = durations({ ...s, endedAt: T0 + 60_000 });
    expect(d.airborneMs).toBeNull();
    expect(d.trackedMs).toBe(60_000);
  });
});

describe("FR24 enrichment", () => {
  it("fills gaps and never overwrites what the phone already established", () => {
    const merged = mergeEnrichment(
      { departureAirport: "KSQL", arrivalAirport: null, fr24FlightId: null },
      { departureAirport: "KHAF", arrivalAirport: "KSQL", fr24FlightId: "fr24-1" },
    );
    expect(merged.departureAirport).toBe("KSQL");
    expect(merged.arrivalAirport).toBe("KSQL");
    expect(merged.fr24FlightId).toBe("fr24-1");
  });
});

describe("landing detection away from the departure point", () => {
  it("stays silent rather than guessing when the aircraft lands elsewhere", () => {
    // The phone has no airport database, so proximity is measured against
    // where the session started. Landing at a different field produces no
    // prompt -- which is the right failure. END FLIGHT is always available.
    let s = session();
    for (let i = 1; i <= 5; i++) s = addFix(s, pos(i, { speed: 45 }));
    for (let i = 10; i <= 400; i += 10) {
      s = addFix(s, {
        ...pos(i, { speed: 0 }),
        coords: { ...pos(i, { speed: 0 }).coords, latitude: 38.6, longitude: -121.6 },
      });
    }
    expect(looksLanded(s)).toBe(false);
  });
});
