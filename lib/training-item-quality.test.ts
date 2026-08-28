import { describe, expect, it } from "vitest";
import { filterTrainingItemDescriptions, isLowQualityTrainingItem } from "./training-item-quality";

describe("isLowQualityTrainingItem", () => {
  it("rejects vague restatements with no nameable skill", () => {
    // Verbatim from a real debrief -- the item that prompted this guard.
    expect(isLowQualityTrainingItem("Need to keep working on that.")).toBe(true);
    expect(isLowQualityTrainingItem("I need to work on that")).toBe(true);
    expect(isLowQualityTrainingItem("Keep working on this")).toBe(true);
    expect(isLowQualityTrainingItem("Needs more practice")).toBe(true);
    expect(isLowQualityTrainingItem("Work on it")).toBe(true);
  });

  it("rejects narrative recaps, which belong in instructorAssistance", () => {
    expect(
      isLowQualityTrainingItem("Danny walked me through an engine-out simulation and had me pick a field."),
    ).toBe(true);
    expect(isLowQualityTrainingItem("Instructor demonstrated a crosswind landing")).toBe(true);
    expect(isLowQualityTrainingItem("We practiced steep turns")).toBe(true);
  });

  it("keeps entries that name a specific skill", () => {
    expect(isLowQualityTrainingItem("Crosswind landing technique")).toBe(false);
    expect(isLowQualityTrainingItem("Power management in steep turns")).toBe(false);
    expect(isLowQualityTrainingItem("Rollout timing to hit target heading in steep turns")).toBe(false);
    expect(isLowQualityTrainingItem("Holding back pressure through soft-field landing rollout")).toBe(false);
    expect(
      isLowQualityTrainingItem("Wind awareness and bank angle adjustment in S-turns relative to wind direction"),
    ).toBe(false);
  });

  it("keeps a named skill even when the instructor is mentioned mid-sentence", () => {
    expect(isLowQualityTrainingItem("Crosswind landings -- instructor demonstrated one on the second circuit")).toBe(
      false,
    );
  });

  it("rejects empty and single-word fragments", () => {
    expect(isLowQualityTrainingItem("")).toBe(true);
    expect(isLowQualityTrainingItem("   ")).toBe(true);
    expect(isLowQualityTrainingItem("landings")).toBe(true);
  });

  it("filters a list while preserving order", () => {
    expect(
      filterTrainingItemDescriptions([
        "Crosswind landing technique",
        "Need to keep working on that.",
        "Power management in steep turns",
      ]),
    ).toEqual(["Crosswind landing technique", "Power management in steep turns"]);
  });
});
