import { describe, it, expect } from "vitest";
import {
  computeAirportInsights,
  hasEnoughData,
  MIN_FLIGHT_COUNT,
  seasonOf,
  type AirportFlight,
} from "./airport-insights";

const flight = (f: Partial<AirportFlight> = {}): AirportFlight => ({
  kind: "local",
  localHour: 10,
  localDayOfWeek: 3,
  localMonth: 4,
  ...f,
});

describe("computeAirportInsights", () => {
  it("returns empty findings rather than dividing by zero", () => {
    const insights = computeAirportInsights([]);
    expect(insights.flightCount).toBe(0);
    expect(insights.localShare).toBe(0);
    expect(insights.medianLocalMinutes).toBeNull();
    expect(insights.busiestHours).toEqual([]);
  });

  it("ranks hours by volume and reports each as a share", () => {
    const insights = computeAirportInsights([
      flight({ localHour: 9 }),
      flight({ localHour: 9 }),
      flight({ localHour: 9 }),
      flight({ localHour: 14 }),
    ]);
    expect(insights.busiestHours[0]).toEqual({ hour: 9, flights: 3, share: 0.75 });
    expect(insights.busiestHours[1].hour).toBe(14);
  });

  it("breaks ties by hour so recomputation is stable", () => {
    // Two equally busy hours must not flip order between runs -- a page whose
    // "busiest hour" changes with no new data looks wrong even when it isn't.
    const a = computeAirportInsights([flight({ localHour: 16 }), flight({ localHour: 8 })]);
    const b = computeAirportInsights([flight({ localHour: 8 }), flight({ localHour: 16 })]);
    expect(a.busiestHours.map((h) => h.hour)).toEqual([8, 16]);
    expect(b.busiestHours.map((h) => h.hour)).toEqual([8, 16]);
  });

  it("counts destinations from departures only", () => {
    // Counting the arrival leg too would double every round trip.
    const insights = computeAirportInsights([
      flight({ kind: "departure", destination: "KHAF" }),
      flight({ kind: "arrival", destination: "KHAF" }),
    ]);
    expect(insights.commonDestinations).toEqual([{ airport: "KHAF", flights: 1 }]);
  });
});

describe("local flights", () => {
  it("measures training intensity as the share that returned here", () => {
    const insights = computeAirportInsights([
      flight({ kind: "local" }),
      flight({ kind: "local" }),
      flight({ kind: "departure" }),
      flight({ kind: "arrival" }),
    ]);
    expect(insights.localShare).toBe(0.5);
  });

  it("takes the median local duration, not the mean", () => {
    // One four-hour outlier among lessons must not move the typical figure.
    const insights = computeAirportInsights([
      flight({ kind: "local", durationMinutes: 60 }),
      flight({ kind: "local", durationMinutes: 70 }),
      flight({ kind: "local", durationMinutes: 80 }),
      flight({ kind: "local", durationMinutes: 480 }),
    ]);
    expect(insights.medianLocalMinutes).toBe(75);
  });

  it("ignores durations from flights that were not local", () => {
    const insights = computeAirportInsights([
      flight({ kind: "local", durationMinutes: 60 }),
      flight({ kind: "departure", durationMinutes: 600 }),
    ]);
    expect(insights.medianLocalMinutes).toBe(60);
  });

  it("reports no median when no local flight carried a duration", () => {
    const insights = computeAirportInsights([flight({ kind: "local", durationMinutes: null })]);
    expect(insights.medianLocalMinutes).toBeNull();
  });
});

describe("seasonality", () => {
  it("reports each season's own peak hour, not the annual one", () => {
    // The whole point of the seasonal cut: a field that flies at dawn in
    // summer and mid-morning in winter has no single meaningful "busy hour".
    const insights = computeAirportInsights([
      ...Array.from({ length: 5 }, () => flight({ localMonth: 7, localHour: 6 })),
      ...Array.from({ length: 2 }, () => flight({ localMonth: 7, localHour: 10 })),
      ...Array.from({ length: 6 }, () => flight({ localMonth: 1, localHour: 10 })),
    ]);
    expect(insights.bySeason.find((s) => s.season === "summer")?.peakHour).toBe(6);
    expect(insights.bySeason.find((s) => s.season === "winter")?.peakHour).toBe(10);
  });

  it("reports an absent season as absent rather than defaulting to midnight", () => {
    const insights = computeAirportInsights([flight({ localMonth: 4 })]);
    expect(insights.bySeason.find((s) => s.season === "summer")).toEqual({
      season: "summer",
      flights: 0,
      share: 0,
      peakHour: null,
    });
  });

  it("always returns all four seasons so a gap is visible", () => {
    const insights = computeAirportInsights([flight({ localMonth: 4 })]);
    expect(insights.bySeason.map((s) => s.season)).toEqual(["winter", "spring", "summer", "fall"]);
  });

  it("puts December with January and February", () => {
    expect(seasonOf(12)).toBe("winter");
    expect(seasonOf(1)).toBe("winter");
  });
});

describe("operators", () => {
  it("ranks operators and skips flights with none reported", () => {
    const insights = computeAirportInsights([
      flight({ operator: "OXF" }),
      flight({ operator: "OXF" }),
      flight({ operator: null }),
    ]);
    expect(insights.topOperators).toEqual([{ operator: "OXF", flights: 2, share: 2 / 3 }]);
  });
});

describe("hasEnoughData", () => {
  it("gates on the published floor", () => {
    expect(hasEnoughData(Array.from({ length: MIN_FLIGHT_COUNT - 1 }, () => flight()))).toBe(false);
    expect(hasEnoughData(Array.from({ length: MIN_FLIGHT_COUNT }, () => flight()))).toBe(true);
  });
});
