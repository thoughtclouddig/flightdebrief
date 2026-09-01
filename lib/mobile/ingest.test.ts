import { describe, expect, it } from "vitest";
import {
  createSession,
  durations,
  ingestBatch,
  toCreateFlightInput,
  toTrackPositions,
  type MobileFix,
  type MobileSession,
} from "@/lib/mobile/ingest";

const T0 = Date.UTC(2026, 7, 29, 20, 0, 0);

function session(): MobileSession {
  return createSession({
    id: "sess-1",
    userId: "u-mia",
    t0: T0,
    aircraftTail: "N4521P",
    instructorId: "u-jake",
    device: { platform: "ios", model: "iPhone15,2", appVersion: "0.1.0" },
  });
}

function fix(t: number, over: Partial<MobileFix> = {}): MobileFix {
  return {
    t: t * 1000,
    lat: 37.51,
    lon: -122.25,
    altitudeM: 300,
    speedMps: 40,
    courseDeg: 270,
    accuracyM: 8,
    altitudeAccuracyM: 12,
    ...over,
  };
}

describe("idempotent ingestion", () => {
  it("folds a batch in once, however many times it arrives", () => {
    // The common failure: the upload succeeded, the acknowledgement did not.
    const batch = { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(1), fix(2)] };
    const first = ingestBatch(session(), batch);
    expect(first.duplicate).toBe(false);
    expect(first.accepted).toBe(2);

    const second = ingestBatch(first.session, batch);
    expect(second.duplicate).toBe(true);
    expect(second.accepted).toBe(0);
    expect(second.session.fixes).toHaveLength(2);
  });

  it("dedupes overlapping batches sent from an older checkpoint", () => {
    // A different key, but the fixes overlap -- what a client does after a
    // crash when it resends from the last checkpoint it managed to persist.
    const s = ingestBatch(session(), { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(1), fix(2)] }).session;
    const r = ingestBatch(s, { idempotencyKey: "b2", sessionId: "sess-1", fixes: [fix(2), fix(3)] });
    expect(r.duplicate).toBe(false);
    expect(r.accepted).toBe(1);
    expect(r.session.fixes.map((f) => f.t)).toEqual([1000, 2000, 3000]);
  });

  it("orders fixes by t regardless of the order batches arrive", () => {
    let s = ingestBatch(session(), { idempotencyKey: "b2", sessionId: "sess-1", fixes: [fix(30), fix(40)] }).session;
    s = ingestBatch(s, { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(10), fix(20)] }).session;
    expect(s.fixes.map((f) => f.t)).toEqual([10_000, 20_000, 30_000, 40_000]);
  });
});

describe("no fabricated values", () => {
  it("keeps unreported altitude and speed null through the round trip", () => {
    const s = ingestBatch(session(), {
      idempotencyKey: "b1",
      sessionId: "sess-1",
      fixes: [fix(1, { altitudeM: null, speedMps: null })],
    }).session;
    const [p] = toTrackPositions(s);
    expect(p!.altitudeFt).toBeUndefined();
    expect(p!.groundSpeedKt).toBeUndefined();
  });

  it("carries course over ground and never a heading field", () => {
    const s = ingestBatch(session(), { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(1)] }).session;
    expect(Object.keys(s.fixes[0]!)).toContain("courseDeg");
    expect(Object.keys(s.fixes[0]!)).not.toContain("heading");
  });

  it("converts groundspeed to knots without ever gaining an airspeed field", () => {
    const s = ingestBatch(session(), { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(1, { speedMps: 40 })] }).session;
    const [p] = toTrackPositions(s);
    expect(p!.groundSpeedKt).toBe(78);
    expect(Object.keys(p!)).not.toContain("indicatedAirspeedKt");
  });
});

describe("poor fixes", () => {
  it("drops them from the track rather than smoothing them", () => {
    // A 400m fix puts a corner in the track that segmentation would read as
    // a manoeuvre. Fewer points beats an invented one.
    const s = ingestBatch(session(), {
      idempotencyKey: "b1",
      sessionId: "sess-1",
      fixes: [fix(1, { accuracyM: 5 }), fix(2, { accuracyM: 400 }), fix(3, { accuracyM: null })],
    }).session;
    expect(s.fixes).toHaveLength(3);
    expect(toTrackPositions(s)).toHaveLength(1);
  });
});

describe("durations", () => {
  it("does not bill preflight and taxi as flight time", () => {
    const fixes = [
      ...Array.from({ length: 10 }, (_, i) => fix(i * 60, { speedMps: 0 })),
      ...Array.from({ length: 5 }, (_, i) => fix(600 + i * 60, { speedMps: 45 })),
    ];
    const s = ingestBatch(session(), { idempotencyKey: "b1", sessionId: "sess-1", fixes }).session;
    const d = durations({ ...s, endedAt: T0 + 900_000 });
    expect(d.sessionMs).toBe(900_000);
    expect(d.airborneMs).toBe(240_000);
    expect(d.trackedMs).toBe(240_000);
  });
});

describe("handing off to the existing Flight model", () => {
  it("records PHONE_GPS provenance and leaves fr24FlightId null", () => {
    const s = ingestBatch(session(), { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(1), fix(2)] }).session;
    const input = toCreateFlightInput({ ...s, endedAt: T0 + 60_000 }, { aircraftId: "ac-1" });
    expect(input.externalProvider).toBe("PHONE_GPS");
    expect(input.externalId).toBe("sess-1");
    // Null is what makes the map say "logged by hand" rather than "ADS-B was
    // sparse". A phone flight was never matched to an ADS-B track.
    expect(input.fr24FlightId).toBeNull();
    expect(input.studentId).toBe("u-mia");
  });

  it("produces a track the existing replay pipeline can consume", () => {
    const s = ingestBatch(session(), { idempotencyKey: "b1", sessionId: "sess-1", fixes: [fix(0), fix(30)] }).session;
    const input = toCreateFlightInput(s, { aircraftId: "ac-1" });
    expect(input.track).toHaveLength(2);
    // Timestamps are absolute ISO, reconstructed from t0 + t -- so the shared
    // replay clock survives the round trip through the server.
    expect(input.track![0]!.timestamp).toBe(new Date(T0).toISOString());
    expect(input.track![1]!.timestamp).toBe(new Date(T0 + 30_000).toISOString());
  });
});
