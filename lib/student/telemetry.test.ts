import { describe, expect, it } from "vitest";
import {
  FR24_CAPABILITIES,
  compareSegments,
  normalizeTrack,
  segmentFlight,
} from "@/lib/student/telemetry";
import { analysisFor } from "@/lib/prototype/moments";

describe("telemetry capabilities", () => {
  it("does not claim airspeed from ADS-B", () => {
    // Groundspeed is not airspeed, and in the crosswind lessons this product
    // is about, the difference is the entire teaching point.
    expect(FR24_CAPABILITIES.groundSpeed).toBe(true);
    expect(FR24_CAPABILITIES.indicatedAirspeed).toBe(false);
  });

  it("does not claim heading, attitude or controls from ADS-B", () => {
    expect(FR24_CAPABILITIES.heading).toBe(false);
    expect(FR24_CAPABILITIES.pitch).toBe(false);
    expect(FR24_CAPABILITIES.bank).toBe(false);
    expect(FR24_CAPABILITIES.controls).toBe(false);
    expect(FR24_CAPABILITIES.engine).toBe(false);
  });
});

describe("normalizeTrack", () => {
  it("leaves an underived value null rather than zero", () => {
    const t = normalizeTrack(
      [{ lat: 37.5, lon: -122.2, altitudeFt: 1000, groundSpeedKt: 80, timestamp: "2026-08-29T20:00:00Z" }],
      "FR24",
    );
    // The first sample has no predecessor, so there is no vertical rate to
    // derive. A zero here would read as "level", which is a claim.
    expect(t.points[0]!.verticalRateFpm).toBeNull();
    expect(t.points[0]!.trackDeg).toBeNull();
  });

  it("survives duplicate timestamps without an infinite climb rate", () => {
    const t = normalizeTrack(
      [
        { lat: 37.5, lon: -122.2, altitudeFt: 1000, groundSpeedKt: 80, timestamp: "2026-08-29T20:00:00Z" },
        { lat: 37.5, lon: -122.2, altitudeFt: 1200, groundSpeedKt: 80, timestamp: "2026-08-29T20:00:00Z" },
      ],
      "FR24",
    );
    expect(t.points[1]!.verticalRateFpm).toBeNull();
  });

  it("reports an empty track as having no capabilities", () => {
    const t = normalizeTrack([], "FR24");
    expect(t.capabilities.position).toBe(false);
    expect(t.durationMs).toBe(0);
  });
});

describe("segmentation", () => {
  it("finds repeated approaches in the seeded pattern flight", () => {
    const analysis = analysisFor("aug-29");
    expect(analysis).not.toBeNull();
    const approaches = analysis!.segments.filter((s) => s.type === "APPROACH");
    expect(approaches.length).toBeGreaterThan(1);
  });

  it("carries confidence rather than presenting inference as fact", () => {
    const analysis = analysisFor("aug-29")!;
    for (const s of analysis.segments) {
      expect(s.confidence).toBeGreaterThan(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("returns nothing for a flight with no track", () => {
    // The hand-entered solo flight. Offering analysis and then explaining
    // there is no data is worse than not offering it.
    expect(analysisFor("aug-08")).toBeNull();
  });

  it("declines to segment a track with no vertical structure", () => {
    const flat = Array.from({ length: 20 }, (_, i) => ({
      lat: 37.5 + i * 0.001,
      lon: -122.2,
      altitudeFt: 1000,
      groundSpeedKt: 90,
      timestamp: new Date(Date.UTC(2026, 7, 29, 20, i)).toISOString(),
    }));
    expect(segmentFlight(normalizeTrack(flat, "FR24"))).toEqual([]);
  });
});

describe("moment anchoring", () => {
  it("links post-flight remarks to a segment, never to a fabricated second", () => {
    const analysis = analysisFor("aug-29")!;
    expect(analysis.moments.length).toBeGreaterThan(0);
    for (const m of analysis.moments) {
      // Jake said all of this on the ramp. An EXACT_TIMESTAMP anchor here
      // would put a quotation mark on a second that never happened.
      expect(m.anchor.kind).toBe("SEGMENT_ASSOCIATION");
      expect(m.anchor.segmentId).toBe(m.segmentId);
    }
  });

  it("keeps instructor words verbatim and separate from Vector's reading", () => {
    const analysis = analysisFor("aug-29")!;
    const a2 = analysis.moments.find((m) => m.segmentId === "approach-2")!;
    expect(a2.instructorEvidence?.who).toBe("Jake");
    expect(a2.vectorInference).not.toBe(a2.instructorEvidence?.quote);
  });
});

describe("compareSegments", () => {
  it("omits dimensions the source cannot support", () => {
    const analysis = analysisFor("aug-29")!;
    const [a, b] = analysis.segments.filter((s) => s.type === "APPROACH");
    const stripped = { ...analysis.telemetry, capabilities: { ...analysis.telemetry.capabilities, groundSpeed: false, verticalRate: false } };
    const rows = compareSegments(stripped, a!, b!);
    expect(rows.some((r) => r.label === "Groundspeed")).toBe(false);
    expect(rows.some((r) => r.label === "Descent profile")).toBe(false);
  });

  it("only ever states relative differences", () => {
    const analysis = analysisFor("aug-29")!;
    const [a, b] = analysis.segments.filter((s) => s.type === "APPROACH");
    for (const row of compareSegments(analysis.telemetry, a!, b!)) {
      // "variation", never "stable" / "met criteria" -- a verdict on whether
      // an approach was stabilized belongs to the instructor.
      expect(`${row.a} ${row.b}`).toMatch(/variation/);
      expect(`${row.a} ${row.b}`).not.toMatch(/stabili[sz]ed|criteria|pass|fail/i);
    }
  });
});
