import { describe, expect, it } from "vitest";
import { buildSuggestedQuestion, computeRecurringThemes, recurringThemeSummary } from "./training-memory";
import type { TrainingSignal } from "@/lib/types";

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

describe("computeRecurringThemes", () => {
  const signal = (over: Partial<TrainingSignal>): TrainingSignal =>
    ({
      id: "s1",
      organizationId: "org",
      studentId: "stu",
      instructorId: "cfi-1",
      aircraftId: null,
      flightId: "f1",
      debriefId: "d1",
      flightDate: "2026-06-01",
      category: "LANDINGS",
      skill: "CROSSWIND_LANDING",
      status: "NEEDS_COACHING",
      source: "INSTRUCTOR",
      statement: "Drifting right in the flare.",
      dismissed: false,
      ...over,
    }) as TrainingSignal;

  it("counts distinct instructors across the flights where a skill recurred", () => {
    const themes = computeRecurringThemes(
      [
        signal({ id: "a", flightId: "f1", flightDate: "2026-06-01", instructorId: "marcus" }),
        signal({ id: "b", flightId: "f2", flightDate: "2026-07-01", instructorId: "dana" }),
        signal({ id: "c", flightId: "f3", flightDate: "2026-08-01", instructorId: "dana" }),
      ],
      7,
      new Map([
        ["marcus", "Marcus Reed"],
        ["dana", "Dana Whitfield"],
      ]),
    );
    expect(themes).toHaveLength(1);
    expect(themes[0]!.count).toBe(3);
    expect(themes[0]!.instructorCount).toBe(2);
    expect(themes[0]!.lessons.map((l) => l.instructorName)).toEqual(["Marcus Reed", "Dana Whitfield", "Dana Whitfield"]);
  });

  // One talkative debrief emitting three signals for the same skill is one
  // lesson, not three -- otherwise a single flight reads as a pattern.
  it("counts lessons, not signals", () => {
    const themes = computeRecurringThemes(
      [
        signal({ id: "a", flightId: "f1" }),
        signal({ id: "b", flightId: "f1" }),
        signal({ id: "c", flightId: "f2", flightDate: "2026-07-01" }),
      ],
      4,
    );
    expect(themes[0]!.count).toBe(2);
  });

  it("does not let a solo flight inflate the instructor count", () => {
    const themes = computeRecurringThemes(
      [
        signal({ id: "a", flightId: "f1", instructorId: "marcus" }),
        signal({ id: "b", flightId: "f2", flightDate: "2026-07-01", instructorId: null }),
      ],
      4,
      new Map([["marcus", "Marcus Reed"]]),
    );
    expect(themes[0]!.instructorCount).toBe(1);
  });

  it("surfaces cross-instructor themes above single-instructor ones", () => {
    const themes = computeRecurringThemes(
      [
        // Four lessons, one instructor.
        signal({ id: "a", skill: "RADIO_COMMUNICATIONS", flightId: "f1", instructorId: "marcus" }),
        signal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightId: "f2", flightDate: "2026-06-02", instructorId: "marcus" }),
        signal({ id: "c", skill: "RADIO_COMMUNICATIONS", flightId: "f3", flightDate: "2026-06-03", instructorId: "marcus" }),
        signal({ id: "d", skill: "RADIO_COMMUNICATIONS", flightId: "f4", flightDate: "2026-06-04", instructorId: "marcus" }),
        // Two lessons, two instructors -- fewer lessons, but nobody could see it.
        signal({ id: "e", skill: "CROSSWIND_LANDING", flightId: "f5", flightDate: "2026-06-05", instructorId: "marcus" }),
        signal({ id: "f", skill: "CROSSWIND_LANDING", flightId: "f6", flightDate: "2026-06-06", instructorId: "dana" }),
      ],
      8,
    );
    expect(themes[0]!.skill).toBe("CROSSWIND_LANDING");
  });

  it("states persistence without assigning blame", () => {
    const [theme] = computeRecurringThemes(
      [
        signal({ id: "a", flightId: "f1", instructorId: "marcus" }),
        signal({ id: "b", flightId: "f2", flightDate: "2026-07-01", instructorId: "dana" }),
      ],
      6,
    );
    const summary = recurringThemeSummary(theme!);
    expect(summary).toContain("2 lessons with 2 instructors");
    expect(summary.toLowerCase()).not.toMatch(/fail|didn't fix|did not fix|blame|missed/);
  });

  it("needs at least two flights of history before claiming anything", () => {
    expect(computeRecurringThemes([signal({})], 1)).toEqual([]);
  });
});
