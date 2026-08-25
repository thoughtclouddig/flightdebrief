import { describe, expect, it } from "vitest";
import { buildSuggestedQuestion } from "./training-memory";

describe("buildSuggestedQuestion", () => {
  it("templates a question from the top focus area", () => {
    expect(buildSuggestedQuestion(["Stabilized approaches"], [])).toBe(
      "Can we spend a few extra minutes on stabilized approaches today?",
    );
  });

  it("falls back to the top keep-working-on item when there's no focus area", () => {
    expect(buildSuggestedQuestion([], ["Radio calls before entering the pattern"])).toBe(
      "Can we spend a few extra minutes on radio calls before entering the pattern today?",
    );
  });

  it("returns null when there's nothing to ask about, never inventing one", () => {
    expect(buildSuggestedQuestion([], [])).toBeNull();
  });
});
