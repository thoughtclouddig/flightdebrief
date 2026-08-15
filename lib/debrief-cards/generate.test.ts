import { describe, expect, it } from "vitest";
import { generateDebriefCards, type GenerateCardsInput, type RecentSkillHistoryEntry } from "./generate";
import type { CardDefinition, FlightTask } from "@/lib/types";

const CARD_DEFS: CardDefinition[] = [
  { id: "def-objective", organizationId: null, code: "objective", category: "OBJECTIVE", title: "Flight Objective", primaryPrompt: "What were we working on today?", followUpPrompts: [], appliesToTaskCode: null, defaultPriority: 0, active: true, createdAt: "" },
  { id: "def-risk", organizationId: null, code: "risk_management", category: "RISK_ADM", title: "Risk Management / ADM", primaryPrompt: "Was there a decision today that's worth talking about?", followUpPrompts: [], appliesToTaskCode: null, defaultPriority: 5, active: true, createdAt: "" },
  { id: "def-next-flight", organizationId: null, code: "next_flight", category: "NEXT_FLIGHT", title: "Next Flight", primaryPrompt: "What should we focus on next flight?", followUpPrompts: [], appliesToTaskCode: null, defaultPriority: 1, active: true, createdAt: "" },
  { id: "def-key-task", organizationId: null, code: "key_training_task", category: "KEY_TASK", title: "Key Training Task", primaryPrompt: "What went well, and what still needs work?", followUpPrompts: [], appliesToTaskCode: null, defaultPriority: 30, active: true, createdAt: "" },
];

function task(taskCode: string, label: string): FlightTask {
  return { id: `task-${taskCode}`, flightId: "flight-1", taskCode: taskCode as FlightTask["taskCode"], label, source: "instructor_selected", sortOrder: 0, createdAt: "" };
}

function baseInput(overrides: Partial<GenerateCardsInput> = {}): GenerateCardsInput {
  return {
    flightTasks: [],
    studentRatings: new Map(),
    instructorRatings: new Map(),
    cardDefinitions: CARD_DEFS,
    recentSkillHistory: [],
    lessonObjectiveTaskCode: null,
    ...overrides,
  };
}

describe("generateDebriefCards", () => {
  it("always includes the three anchor cards even with no ratings at all", () => {
    const cards = generateDebriefCards(baseInput());
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.category)).toEqual(["OBJECTIVE", "RISK_ADM", "NEXT_FLIGHT"]);
    expect(cards.map((c) => c.sortOrder)).toEqual([0, 1, 2]);
  });

  it("puts a significant discrepancy ahead of a minor one", () => {
    const tasks = [task("CROSSWIND_LANDING", "Crosswind Landings"), task("STEEP_TURNS", "Steep Turns")];
    const cards = generateDebriefCards(
      baseInput({
        flightTasks: tasks,
        studentRatings: new Map([
          ["CROSSWIND_LANDING", "INDEPENDENT"],
          ["STEEP_TURNS", "NEEDS_COACHING"],
        ]),
        instructorRatings: new Map([
          ["CROSSWIND_LANDING", "LEARNING"], // distance 2 -- significant
          ["STEEP_TURNS", "INDEPENDENT"], // distance 1 -- minor
        ]),
      }),
    );
    const discrepancyCards = cards.filter((c) => c.source === "assessment_discrepancy");
    expect(discrepancyCards).toHaveLength(2);
    expect(discrepancyCards[0].title).toBe("Crosswind Landings");
    expect(discrepancyCards[0].discrepancyStatus).toBe("significant");
    expect(discrepancyCards[1].title).toBe("Steep Turns");
    expect(discrepancyCards[1].discrepancyStatus).toBe("minor");
  });

  it("gives a task with a discrepancy exactly one card, never also a needs-coaching card", () => {
    const tasks = [task("STALLS", "Stalls")];
    const cards = generateDebriefCards(
      baseInput({
        flightTasks: tasks,
        studentRatings: new Map([["STALLS", "NEEDS_COACHING"]]),
        instructorRatings: new Map([["STALLS", "LEARNING"]]), // both "weak" but also a discrepancy
      }),
    );
    const stallCards = cards.filter((c) => c.title === "Stalls");
    expect(stallCards).toHaveLength(1);
    expect(stallCards[0].source).toBe("assessment_discrepancy");
  });

  it("caps total cards at 8 even with many discrepancies", () => {
    const codes = ["STALLS", "STEEP_TURNS", "SLOW_FLIGHT", "CROSSWIND_LANDING", "SHORT_FIELD_LANDING", "GO_AROUND", "TRAFFIC_PATTERN", "NAVIGATION", "STABILIZED_APPROACH", "NORMAL_TAKEOFF"];
    const tasks = codes.map((c) => task(c, c));
    const studentRatings = new Map(codes.map((c) => [c, "INDEPENDENT" as const]));
    const instructorRatings = new Map(codes.map((c) => [c, "LEARNING" as const])); // every task is a significant discrepancy
    const cards = generateDebriefCards(baseInput({ flightTasks: tasks, studentRatings, instructorRatings }));
    expect(cards.length).toBeLessThanOrEqual(8);
  });

  it("elevates the Risk/ADM anchor prompt when a risk-related task is rated weak", () => {
    const tasks = [task("RISK_MANAGEMENT", "Risk Management")];
    const cards = generateDebriefCards(
      baseInput({
        flightTasks: tasks,
        studentRatings: new Map([["RISK_MANAGEMENT", "NEEDS_COACHING"]]),
        instructorRatings: new Map([["RISK_MANAGEMENT", "NEEDS_COACHING"]]),
      }),
    );
    const riskCard = cards.find((c) => c.category === "RISK_ADM");
    expect(riskCard).toBeDefined();
    expect(riskCard!.primaryPrompt).toContain("risk management");
    expect(riskCard!.primaryPrompt.toLowerCase()).not.toContain("unsafe");
  });

  it("surfaces a previous-flight issue flagged in 2 of the last 3 flights", () => {
    const tasks = [task("AIRSPEED_CONTROL", "Airspeed Control")];
    const history: RecentSkillHistoryEntry[] = [{ taskCode: "AIRSPEED_CONTROL", flaggedCount: 2, consideredFlights: 3 }];
    const cards = generateDebriefCards(baseInput({ flightTasks: tasks, recentSkillHistory: history }));
    const issueCard = cards.find((c) => c.source === "previous_flight_issue");
    expect(issueCard).toBeDefined();
    expect(issueCard!.title).toBe("Airspeed Control");
  });

  it("does not surface a previous-flight issue flagged in only 1 of the last 3 flights", () => {
    const tasks = [task("AIRSPEED_CONTROL", "Airspeed Control")];
    const history: RecentSkillHistoryEntry[] = [{ taskCode: "AIRSPEED_CONTROL", flaggedCount: 1, consideredFlights: 3 }];
    const cards = generateDebriefCards(baseInput({ flightTasks: tasks, recentSkillHistory: history }));
    expect(cards.some((c) => c.source === "previous_flight_issue")).toBe(false);
  });

  it("folds tasks both rated Independent with no history into one lightweight card, not one each", () => {
    const tasks = [task("CHECKLIST_DISCIPLINE", "Checklist Discipline"), task("TOWER_READBACKS", "Tower Communications")];
    const studentRatings = new Map([
      ["CHECKLIST_DISCIPLINE", "INDEPENDENT" as const],
      ["TOWER_READBACKS", "INDEPENDENT" as const],
    ]);
    const instructorRatings = new Map(studentRatings);
    const cards = generateDebriefCards(baseInput({ flightTasks: tasks, studentRatings, instructorRatings }));
    const quietCards = cards.filter((c) => c.title === "Also looking solid");
    expect(quietCards).toHaveLength(1);
    expect(quietCards[0].primaryPrompt).toContain("Checklist Discipline");
    expect(quietCards[0].primaryPrompt).toContain("Tower Communications");
  });

  it("celebrates a task that improved from a flagged history to Independent on both sides", () => {
    const tasks = [task("STALLS", "Stalls")];
    const studentRatings = new Map([["STALLS", "INDEPENDENT" as const]]);
    const instructorRatings = new Map([["STALLS", "INDEPENDENT" as const]]);
    const history: RecentSkillHistoryEntry[] = [{ taskCode: "STALLS", flaggedCount: 2, consideredFlights: 3 }];
    const cards = generateDebriefCards(baseInput({ flightTasks: tasks, studentRatings, instructorRatings, recentSkillHistory: history }));
    const improvement = cards.find((c) => c.category === "STRENGTHS" && c.title === "Stalls");
    expect(improvement).toBeDefined();
    expect(improvement!.source).toBe("standard");
  });

  it("re-numbers sortOrder to a clean 0..n sequence with Next Flight always last", () => {
    const tasks = [task("STALLS", "Stalls")];
    const cards = generateDebriefCards(
      baseInput({
        flightTasks: tasks,
        studentRatings: new Map([["STALLS", "INDEPENDENT"]]),
        instructorRatings: new Map([["STALLS", "LEARNING"]]),
      }),
    );
    expect(cards.map((c) => c.sortOrder)).toEqual(cards.map((_, i) => i));
    expect(cards[cards.length - 1].category).toBe("NEXT_FLIGHT");
  });
});
