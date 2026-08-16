import { describe, expect, it } from "vitest";
import { bandFor, computeFlightScore, MIN_FLIGHTS_FOR_SCORE, MIN_OBSERVATIONS_FOR_SCORE } from "./flight-score";
import type { SkillObservation } from "@/lib/types";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

function obs(
  overrides: Partial<SkillObservation> & { flightId: string; flightDate: string; performanceLevel: PerformanceLevelCode },
): SkillObservation {
  return {
    aircraftId: "aircraft-1",
    taskCode: "STEEP_TURNS",
    taskLabel: "Steep Turns",
    note: null,
    submittedAt: `${overrides.flightDate}T20:00:00.000Z`,
    ...overrides,
  };
}

describe("bandFor", () => {
  it("bands 90-100 as Strong with a good tone", () => {
    expect(bandFor(95)).toEqual({ band: "Strong", tone: "good" });
    expect(bandFor(90)).toEqual({ band: "Strong", tone: "good" });
  });

  it("bands 75-89 as Progressing with a good tone", () => {
    expect(bandFor(82)).toEqual({ band: "Progressing", tone: "good" });
    expect(bandFor(75)).toEqual({ band: "Progressing", tone: "good" });
  });

  it("bands 60-74 as Developing with an amber tone", () => {
    expect(bandFor(65)).toEqual({ band: "Developing", tone: "amber" });
    expect(bandFor(60)).toEqual({ band: "Developing", tone: "amber" });
  });

  it("bands below 60 as Needs Focus with a danger tone", () => {
    expect(bandFor(59)).toEqual({ band: "Needs Focus", tone: "danger" });
    expect(bandFor(0)).toEqual({ band: "Needs Focus", tone: "danger" });
  });
});

describe("computeFlightScore -- cold start", () => {
  it("stays in the Building state with zero observations", () => {
    const result = computeFlightScore([]);
    expect(result.building).toBe(true);
    expect(result.gauge).toBeNull();
    expect(result.totalObservations).toBe(0);
    expect(result.flightsObserved).toBe(0);
  });

  it("stays Building below the observation-count threshold even with enough flights", () => {
    const observations: SkillObservation[] = Array.from({ length: MIN_OBSERVATIONS_FOR_SCORE - 1 }, (_, i) =>
      obs({ flightId: `f${i}`, flightDate: `2026-01-${String(i + 1).padStart(2, "0")}`, performanceLevel: "INDEPENDENT" }),
    );
    const result = computeFlightScore(observations);
    expect(result.building).toBe(true);
    expect(result.totalObservations).toBe(MIN_OBSERVATIONS_FOR_SCORE - 1);
  });

  it("stays Building below the flight-count threshold even with enough observations", () => {
    // MIN_OBSERVATIONS_FOR_SCORE ratings, but all crammed into a single flight.
    const observations: SkillObservation[] = Array.from({ length: MIN_OBSERVATIONS_FOR_SCORE }, (_, i) =>
      obs({
        flightId: "f0",
        flightDate: "2026-01-01",
        taskCode: i % 2 === 0 ? "STEEP_TURNS" : "SLOW_FLIGHT",
        performanceLevel: "INDEPENDENT",
      }),
    );
    expect(new Set(observations.map((o) => o.flightId)).size).toBeLessThan(MIN_FLIGHTS_FOR_SCORE);
    const result = computeFlightScore(observations);
    expect(result.building).toBe(true);
  });
});

describe("computeFlightScore -- real score", () => {
  function evidence(level: PerformanceLevelCode): SkillObservation[] {
    // MIN_FLIGHTS_FOR_SCORE distinct flights, MIN_OBSERVATIONS_FOR_SCORE total ratings, all one skill/level.
    const observations: SkillObservation[] = [];
    for (let i = 0; i < MIN_OBSERVATIONS_FOR_SCORE; i++) {
      observations.push(
        obs({
          flightId: `f${i % MIN_FLIGHTS_FOR_SCORE}`,
          flightDate: `2026-01-${String(i + 1).padStart(2, "0")}`,
          performanceLevel: level,
        }),
      );
    }
    return observations;
  }

  it("computes a Strong band from consistently Independent ratings", () => {
    const result = computeFlightScore(evidence("INDEPENDENT"));
    expect(result.building).toBe(false);
    expect(result.gauge?.label).toBe("Strong");
    expect(result.gauge?.tone).toBe("good");
    expect(result.gauge?.score).toBeGreaterThanOrEqual(90);
  });

  it("computes a Needs Focus band from consistently Learning ratings", () => {
    const result = computeFlightScore(evidence("LEARNING"));
    expect(result.gauge?.label).toBe("Needs Focus");
    expect(result.gauge?.tone).toBe("danger");
  });

  it("only averages the most recent OBSERVATIONS_PER_SKILL ratings per skill", () => {
    // Five old Learning ratings for the same skill, then three recent Independent ones --
    // the score should reflect only the recent Independent window, not the full history.
    const observations: SkillObservation[] = [
      ...Array.from({ length: 5 }, (_, i) =>
        obs({ flightId: `old${i}`, flightDate: `2025-01-${String(i + 1).padStart(2, "0")}`, performanceLevel: "LEARNING" }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        obs({ flightId: `new${i}`, flightDate: `2026-02-${String(i + 1).padStart(2, "0")}`, performanceLevel: "INDEPENDENT" }),
      ),
    ];
    const result = computeFlightScore(observations);
    expect(result.building).toBe(false);
    const skill = result.skills.find((s) => s.skill === "STEEP_TURNS");
    expect(skill?.observationCount).toBe(3);
    expect(skill?.totalObservationCount).toBe(8);
    expect(skill?.band).toBe("Strong");
  });

  it("detects an upward trend within the scoring window (most recent OBSERVATIONS_PER_SKILL ratings)", () => {
    const observations: SkillObservation[] = [
      obs({ flightId: "f0", flightDate: "2026-01-01", performanceLevel: "LEARNING" }),
      obs({ flightId: "f1", flightDate: "2026-01-08", performanceLevel: "LEARNING" }),
      obs({ flightId: "f2", flightDate: "2026-01-15", performanceLevel: "NEEDS_COACHING" }),
      obs({ flightId: "f3", flightDate: "2026-01-22", performanceLevel: "INDEPENDENT" }),
      obs({ flightId: "f4", flightDate: "2026-01-29", performanceLevel: "INDEPENDENT" }),
    ];
    const result = computeFlightScore(observations);
    const skill = result.skills.find((s) => s.skill === "STEEP_TURNS");
    // Window is the last 3: NEEDS_COACHING, INDEPENDENT, INDEPENDENT -- rising from 67 to 93.
    expect(skill?.trend).toBe("up");
  });

  it("groups skills into categories and averages within each category", () => {
    const observations: SkillObservation[] = [
      ...evidence("INDEPENDENT").map((o) => ({ ...o, taskCode: "STEEP_TURNS" as const, taskLabel: "Steep Turns" })),
      ...evidence("LEARNING").map((o, i) => ({
        ...o,
        flightId: `nav${i}`,
        taskCode: "NAVIGATION" as const,
        taskLabel: "Navigation",
      })),
    ];
    const result = computeFlightScore(observations);
    expect(result.building).toBe(false);
    const maneuvers = result.gauge?.categories?.find((c) => c.label === "Maneuvers");
    const navigation = result.gauge?.categories?.find((c) => c.label === "Navigation");
    expect(maneuvers?.tone).toBe("good");
    expect(navigation?.tone).toBe("danger");
  });
});
