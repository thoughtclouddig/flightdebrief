import { describe, expect, it } from "vitest";
import { dedupeWorkingOnItems } from "./student-detail-presentation";

describe("dedupeWorkingOnItems", () => {
  it("collapses the same item into one bullet when only one copy carries the 'Work on:' label", () => {
    const result = dedupeWorkingOnItems(["Still working on crosswind corrections", "Work on: Still working on crosswind corrections"]);
    expect(result).toEqual(["Still working on crosswind corrections"]);
  });

  it("is case-insensitive when comparing after stripping the label", () => {
    const result = dedupeWorkingOnItems(["Focus on: aim points on final", "Aim points on final"]);
    expect(result).toHaveLength(1);
  });

  it("keeps two genuinely different items -- not semantic/AI deduplication", () => {
    const result = dedupeWorkingOnItems(["Work on: crosswind landings", "Work on: radio communications"]);
    expect(result).toEqual(["crosswind landings", "radio communications"]);
  });

  it("leaves an item with no label untouched when it's the only one", () => {
    const result = dedupeWorkingOnItems(["Keep working on short-field approaches"]);
    expect(result).toEqual(["Keep working on short-field approaches"]);
  });

  it("returns an empty list for an empty input", () => {
    expect(dedupeWorkingOnItems([])).toEqual([]);
  });
});
