import { describe, it, expect } from "vitest";
import { computeAirportInsights, hasEnoughData, MIN_SAMPLE_SIZE, type AirportOperation } from "./airport-insights";

const op = (o: Partial<AirportOperation> = {}): AirportOperation => ({
  operationType: "arrival",
  localHour: 10,
  localDayOfWeek: 3,
  runway: "27",
  ...o,
});

describe("computeAirportInsights", () => {
  it("returns empty findings rather than dividing by zero", () => {
    const insights = computeAirportInsights([]);
    expect(insights.sampleSize).toBe(0);
    expect(insights.patternShare).toBe(0);
    expect(insights.busiestHours).toEqual([]);
  });

  it("ranks hours by volume and reports each as a share", () => {
    const insights = computeAirportInsights([
      op({ localHour: 9 }),
      op({ localHour: 9 }),
      op({ localHour: 9 }),
      op({ localHour: 14 }),
    ]);
    expect(insights.busiestHours[0]).toEqual({ hour: 9, operations: 3, share: 0.75 });
    expect(insights.busiestHours[1].hour).toBe(14);
  });

  it("breaks ties by hour so recomputation is stable", () => {
    // Two equally busy hours must not flip order between runs -- a page whose
    // "busiest hour" changes with no new data looks wrong even when it isn't.
    const a = computeAirportInsights([op({ localHour: 16 }), op({ localHour: 8 })]);
    const b = computeAirportInsights([op({ localHour: 8 }), op({ localHour: 16 })]);
    expect(a.busiestHours.map((h) => h.hour)).toEqual([8, 16]);
    expect(b.busiestHours.map((h) => h.hour)).toEqual([8, 16]);
  });

  it("counts destinations from departures only", () => {
    // Counting the arrival leg too would double every round trip.
    const insights = computeAirportInsights([
      op({ operationType: "departure", destination: "KHAF" }),
      op({ operationType: "arrival", destination: "KHAF" }),
    ]);
    expect(insights.commonDestinations).toEqual([{ airport: "KHAF", flights: 1 }]);
  });

  it("treats pattern work as neither arrival nor departure", () => {
    const insights = computeAirportInsights([
      op({ operationType: "pattern" }),
      op({ operationType: "pattern" }),
      op({ operationType: "arrival" }),
      op({ operationType: "departure" }),
    ]);
    expect(insights.patternShare).toBe(0.5);
    expect(insights.commonDestinations).toEqual([]);
  });

  it("skips operations with no known runway instead of inventing one", () => {
    const insights = computeAirportInsights([op({ runway: "27" }), op({ runway: null })]);
    expect(insights.runwayUse).toEqual([{ runway: "27", operations: 1, share: 0.5 }]);
  });
});

describe("hasEnoughData", () => {
  it("gates on the published floor", () => {
    expect(hasEnoughData(Array.from({ length: MIN_SAMPLE_SIZE - 1 }, () => op()))).toBe(false);
    expect(hasEnoughData(Array.from({ length: MIN_SAMPLE_SIZE }, () => op()))).toBe(true);
  });
});
