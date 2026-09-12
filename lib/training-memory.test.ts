import { describe, expect, it } from "vitest";
import { buildSuggestedQuestion, computeRecommendedFocus, computeRecurringThemes, recurringThemeSummary } from "./training-memory";
import type { NextLessonBrief } from "./training-memory";
import type { Repository } from "@/lib/data/types";
import type { Debrief, TrainingSignal } from "@/lib/types";

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

describe("computeRecommendedFocus — the same ranking Train and Next Flight both use", () => {
  const trainingSignal = (over: Partial<TrainingSignal>): TrainingSignal =>
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

  function fakeRepo(signals: TrainingSignal[]): Repository {
    return { listTrainingSignals: async () => signals } as unknown as Repository;
  }

  function brief(overrides: Partial<NextLessonBrief> = {}): NextLessonBrief {
    return {
      studentId: "stu",
      lastFlight: null,
      lastDebrief: null,
      lastInstructor: null,
      lastInstructorNote: null,
      lastWentWell: [],
      focusAreas: [],
      keepWorkingOn: [],
      beforeFlightItems: [],
      keepWorkingOnTrainingItems: [],
      beforeFlightTrainingItems: [],
      recurringThemes: [],
      upcomingReservation: null,
      upcomingReservationInstructor: null,
      suggestedQuestion: null,
      ...overrides,
    };
  }

  function debriefWithDifferences(
    taskLabel: string,
    studentLevel: "LEARNING" | "NEEDS_COACHING" | "INDEPENDENT",
    instructorLevel: "LEARNING" | "NEEDS_COACHING" | "INDEPENDENT",
  ): Debrief {
    return {
      id: "d1",
      flightId: "f1",
      transcript: "transcript",
      audioDurationSeconds: 60,
      analyzedWith: "mock",
      guidanceMode: "guided",
      recordingStartedAt: null,
      recordingEndedAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      structuredResult: {
        flightSummary: "",
        narrativeRecap: "",
        whatWeDid: [],
        wentWell: [],
        needsWork: [],
        instructorGuidance: [],
        instructorAssistance: [],
        riskManagementNotes: [],
        assessmentDifferences: [{ taskLabel, studentLevel, instructorLevel, note: "" }],
        actionItems: [],
        nextLessonFocus: [],
        studyReferences: [],
        nextFlightCue: "",
        nextFlightCueContext: "",
      },
    } as Debrief;
  }

  it("ranks a contested objective above a recurring theme and the weakest open skill", async () => {
    const signals = [
      // Two-flight recurring theme on radio comms.
      trainingSignal({ id: "a", skill: "RADIO_COMMUNICATIONS", flightId: "f1" }),
      trainingSignal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightId: "f2", flightDate: "2026-06-02" }),
    ];
    const repo = fakeRepo(signals);
    const b = brief({
      lastDebrief: debriefWithDifferences("Crosswind landings", "INDEPENDENT", "NEEDS_COACHING"),
      recurringThemes: [
        { theme: "Radio communications", skill: "RADIO_COMMUNICATIONS", count: 2, consideredFlights: 2, instructorCount: 1, lessons: [] },
      ],
    });

    const focus = await computeRecommendedFocus(repo, b);
    expect(focus.contested?.taskLabel).toBe("Crosswind landings");
    expect(focus.label).toBe("Crosswind landings");
  });

  it("falls back to the recurring theme when there's no contested objective", async () => {
    const signals = [
      trainingSignal({ id: "a", skill: "RADIO_COMMUNICATIONS", flightId: "f1" }),
      trainingSignal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightId: "f2", flightDate: "2026-06-02" }),
    ];
    const repo = fakeRepo(signals);
    const b = brief({
      recurringThemes: [
        { theme: "Radio communications", skill: "RADIO_COMMUNICATIONS", count: 2, consideredFlights: 2, instructorCount: 1, lessons: [] },
      ],
    });

    const focus = await computeRecommendedFocus(repo, b);
    expect(focus.contested).toBeNull();
    expect(focus.theme?.skill).toBe("RADIO_COMMUNICATIONS");
    expect(focus.skillProgression?.skill).toBe("RADIO_COMMUNICATIONS");
    expect(focus.label).toBe("Radio communications");
  });

  it("falls back to the weakest open skill when there's no contested objective or recurring theme", async () => {
    const repo = fakeRepo([trainingSignal({ skill: "CROSSWIND_LANDING", status: "NEEDS_COACHING" })]);
    const b = brief();

    const focus = await computeRecommendedFocus(repo, b);
    expect(focus.contested).toBeNull();
    expect(focus.theme).toBeNull();
    expect(focus.skillProgression?.skill).toBe("CROSSWIND_LANDING");
    expect(focus.label).toBe(focus.skillProgression!.label);
  });

  it("returns openSkills as every not-yet-demonstrated skill, for callers that need the full list", async () => {
    const repo = fakeRepo([
      trainingSignal({ id: "a", skill: "CROSSWIND_LANDING" }),
      trainingSignal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightId: "f2" }),
    ]);
    const focus = await computeRecommendedFocus(repo, brief());
    expect(focus.openSkills.map((s) => s.skill).sort()).toEqual(["CROSSWIND_LANDING", "RADIO_COMMUNICATIONS"]);
  });

  it("returns a null label with no evidence at all, never inventing a recommendation", async () => {
    const repo = fakeRepo([]);
    const focus = await computeRecommendedFocus(repo, brief());
    expect(focus.label).toBeNull();
    expect(focus.skillProgression).toBeNull();
  });
});
