import { describe, expect, it } from "vitest";
import { aggregateRecentSkillHistory } from "./history";

describe("aggregateRecentSkillHistory", () => {
  it("counts a task flagged on 2 of 3 considered flights", () => {
    const result = aggregateRecentSkillHistory([["STALLS"], ["STALLS", "CROSSWIND_LANDING"], []]);
    expect(result).toContainEqual({ taskCode: "STALLS", flaggedCount: 2, consideredFlights: 3 });
    expect(result).toContainEqual({ taskCode: "CROSSWIND_LANDING", flaggedCount: 1, consideredFlights: 3 });
  });

  it("counts a task flagged twice on the same flight only once", () => {
    const result = aggregateRecentSkillHistory([["STALLS", "STALLS"]]);
    expect(result).toEqual([{ taskCode: "STALLS", flaggedCount: 1, consideredFlights: 1 }]);
  });

  it("returns an empty list when nothing was ever flagged", () => {
    expect(aggregateRecentSkillHistory([[], [], []])).toEqual([]);
  });

  it("reports consideredFlights as the number of flights passed in, even with zero flights", () => {
    expect(aggregateRecentSkillHistory([])).toEqual([]);
  });
});
