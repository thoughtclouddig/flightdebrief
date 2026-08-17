import { describe, expect, it } from "vitest";
import { computeStudentFreeFlights, computeSchoolFreeDebriefs } from "./entitlements";
import type { DebriefStatus } from "@/lib/types";

function flights(statuses: DebriefStatus[]) {
  return statuses.map((debriefStatus) => ({ debriefStatus }));
}

describe("computeStudentFreeFlights", () => {
  it("reports the full 3-flight allowance remaining with zero completed debriefs", () => {
    const result = computeStudentFreeFlights(flights(["not_started", "in_progress"]));
    expect(result).toEqual({ used: 0, cap: 3, remaining: 3, exhausted: false });
  });

  it("counts only completed debriefs toward usage", () => {
    const result = computeStudentFreeFlights(flights(["complete", "complete", "in_progress", "not_started"]));
    expect(result).toEqual({ used: 2, cap: 3, remaining: 1, exhausted: false });
  });

  it("marks exhausted exactly at the 3-flight cap", () => {
    const result = computeStudentFreeFlights(flights(["complete", "complete", "complete"]));
    expect(result).toEqual({ used: 3, cap: 3, remaining: 0, exhausted: true });
  });

  it("clamps remaining at zero when usage exceeds the cap", () => {
    const result = computeStudentFreeFlights(flights(["complete", "complete", "complete", "complete"]));
    expect(result).toEqual({ used: 4, cap: 3, remaining: 0, exhausted: true });
  });
});

describe("computeSchoolFreeDebriefs", () => {
  it("reports the full 25-debrief allowance remaining with zero completed debriefs", () => {
    const result = computeSchoolFreeDebriefs(flights(["in_progress"]));
    expect(result).toEqual({ used: 0, cap: 25, remaining: 25, exhausted: false });
  });

  it("counts only completed debriefs toward usage", () => {
    const result = computeSchoolFreeDebriefs(flights(Array(10).fill("complete").concat(Array(3).fill("in_progress"))));
    expect(result).toEqual({ used: 10, cap: 25, remaining: 15, exhausted: false });
  });

  it("marks exhausted exactly at the 25-debrief cap", () => {
    const result = computeSchoolFreeDebriefs(flights(Array(25).fill("complete")));
    expect(result).toEqual({ used: 25, cap: 25, remaining: 0, exhausted: true });
  });

  it("clamps remaining at zero when usage exceeds the cap", () => {
    const result = computeSchoolFreeDebriefs(flights(Array(30).fill("complete")));
    expect(result).toEqual({ used: 30, cap: 25, remaining: 0, exhausted: true });
  });
});
