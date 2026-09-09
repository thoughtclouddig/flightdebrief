import { describe, expect, it } from "vitest";
import { deriveKeepBuilding, deriveNextFlightFocus } from "./next-flight-focus";
import type { RecurringTheme } from "./training-memory";

const RECURRING_THEME: RecurringTheme = {
  theme: "Crosswind Landings",
  skill: "CROSSWIND_LANDING",
  count: 3,
  consideredFlights: 5,
  instructorCount: 2,
  lessons: [],
};

describe("deriveNextFlightFocus", () => {
  it("prefers a recurring theme over any single-flight evidence", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: RECURRING_THEME,
      instructorRatings: [{ label: "Radio Calls", performanceLevel: "LEARNING" }],
      studentRatings: [{ label: "Soft-Field Takeoffs", performanceLevel: "LEARNING" }],
      instructorName: "Jake",
      aiFocusAreas: ["Practice short-field landings"],
      aiContentTrusted: true,
    });
    expect(result).toEqual({
      headline: "Crosswind Landings",
      evidence: "Crosswind Landings has come up in 3 lessons with 2 instructors.",
      kind: "recurring_theme",
      skill: "CROSSWIND_LANDING",
    });
  });

  it("falls back to a real instructor 'Needs Work' rating, attributed by name", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [{ label: "Radio Calls", performanceLevel: "LEARNING" }],
      studentRatings: [{ label: "Soft-Field Takeoffs", performanceLevel: "LEARNING" }],
      instructorName: "Jake",
      aiFocusAreas: ["Practice short-field landings"],
      aiContentTrusted: true,
    });
    expect(result).toEqual({
      headline: "Radio Calls",
      evidence: "Jake rated Radio Calls Needs Work.",
      kind: "instructor_rating",
      skill: null,
    });
  });

  it("falls back to the student's own self-assessment when there's no instructor rating", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [],
      studentRatings: [{ label: "Soft-Field Takeoffs", performanceLevel: "LEARNING" }],
      instructorName: null,
      aiFocusAreas: ["Practice short-field landings"],
      aiContentTrusted: true,
    });
    expect(result).toEqual({
      headline: "Soft-Field Takeoffs",
      evidence: "You rated Soft-Field Takeoffs Needs Work.",
      kind: "student_rating",
      skill: null,
    });
  });

  it("never transforms a student rating into 'you struggled with X' -- the evidence sentence quotes the rating verbatim", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [],
      studentRatings: [{ label: "Lost Procedures", performanceLevel: "LEARNING" }],
      instructorName: null,
      aiFocusAreas: [],
      aiContentTrusted: true,
    });
    expect(result?.evidence).toBe("You rated Lost Procedures Needs Work.");
    expect(result?.evidence).not.toMatch(/struggled/i);
  });

  it("falls back to the AI focus area only when the last debrief was adequate", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [],
      studentRatings: [],
      instructorName: null,
      aiFocusAreas: ["Practice short-field landings"],
      aiContentTrusted: true,
    });
    expect(result).toEqual({ headline: "Practice short-field landings", evidence: null, kind: "ai_focus", skill: null });
  });

  it("never uses the AI focus area when the last debrief failed the adequacy gate", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [],
      studentRatings: [],
      instructorName: null,
      aiFocusAreas: ["Practice short-field landings"],
      aiContentTrusted: false,
    });
    expect(result).toBeNull();
  });

  it("returns null -- an honest empty state -- when there's no evidence of any kind", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [],
      studentRatings: [],
      instructorName: null,
      aiFocusAreas: [],
      aiContentTrusted: true,
    });
    expect(result).toBeNull();
  });

  it("ignores ratings above 'Needs Work' -- Felt Solid/Meets Standard never becomes a focus item", () => {
    const result = deriveNextFlightFocus({
      recurringTheme: null,
      instructorRatings: [{ label: "Radio Calls", performanceLevel: "INDEPENDENT" }],
      studentRatings: [{ label: "Steep Turns", performanceLevel: "INDEPENDENT" }],
      instructorName: "Jake",
      aiFocusAreas: [],
      aiContentTrusted: true,
    });
    expect(result).toBeNull();
  });
});

describe("deriveKeepBuilding", () => {
  it("surfaces 'Improving' ratings from both instructor and student, attributed correctly", () => {
    const result = deriveKeepBuilding(
      [{ label: "Radio Calls", performanceLevel: "NEEDS_COACHING" }],
      [{ label: "Steep Turns", performanceLevel: "NEEDS_COACHING" }],
      "Jake",
      null,
    );
    expect(result).toEqual(["Jake rated Radio Calls Improving.", "You rated Steep Turns Improving."]);
  });

  it("excludes whatever the main focus already named, so nothing repeats", () => {
    const result = deriveKeepBuilding(
      [],
      [
        { label: "Steep Turns", performanceLevel: "NEEDS_COACHING" },
        { label: "Soft-Field Takeoffs", performanceLevel: "NEEDS_COACHING" },
      ],
      null,
      "Steep Turns",
    );
    expect(result).toEqual(["You rated Soft-Field Takeoffs Improving."]);
  });

  it("ignores 'Needs Work' and top-tier ratings -- only the middle tier belongs here", () => {
    const result = deriveKeepBuilding(
      [],
      [
        { label: "A", performanceLevel: "LEARNING" },
        { label: "B", performanceLevel: "INDEPENDENT" },
      ],
      null,
      null,
    );
    expect(result).toEqual([]);
  });
});
