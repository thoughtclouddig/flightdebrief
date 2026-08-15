import { describe, expect, it } from "vitest";
import { computeAssessmentDifferences } from "./differences";

describe("computeAssessmentDifferences", () => {
  it("reports a task where ratings disagree", () => {
    const labels = new Map([["STALLS", "Stalls"]]);
    const diffs = computeAssessmentDifferences(
      labels,
      new Map([["STALLS", "INDEPENDENT"]]),
      new Map([["STALLS", "LEARNING"]]),
    );
    expect(diffs).toEqual([{ taskLabel: "Stalls", studentLevel: "INDEPENDENT", instructorLevel: "LEARNING", note: "" }]);
  });

  it("omits a task where both raters agree", () => {
    const labels = new Map([["STALLS", "Stalls"]]);
    const diffs = computeAssessmentDifferences(
      labels,
      new Map([["STALLS", "INDEPENDENT"]]),
      new Map([["STALLS", "INDEPENDENT"]]),
    );
    expect(diffs).toEqual([]);
  });

  it("omits a task only one rater scored", () => {
    const labels = new Map([["STALLS", "Stalls"]]);
    const diffs = computeAssessmentDifferences(labels, new Map([["STALLS", "INDEPENDENT"]]), new Map());
    expect(diffs).toEqual([]);
  });
});
