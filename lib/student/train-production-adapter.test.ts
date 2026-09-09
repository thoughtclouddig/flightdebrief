import { describe, expect, it } from "vitest";
import { buildProductionTrainProps } from "./train-production-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { TrainingSignal, RadioPracticeAssignment } from "@/lib/types";

const HREFS = { chairFlyHref: "/train/chair-fly", skillHref: (skill: string) => `/progress/${skill}` };

function viewer(): Viewer {
  return {
    user: { id: "student-1", name: "Mia" },
    organization: { id: "org-1", kind: "individual" },
    role: "student",
  } as unknown as Viewer;
}

function signal(overrides: Partial<TrainingSignal> = {}): TrainingSignal {
  return {
    id: "sig-1",
    organizationId: null,
    studentId: "student-1",
    instructorId: null,
    aircraftId: null,
    flightId: "flight-1",
    debriefId: "debrief-1",
    flightDate: "2026-09-01",
    category: "keep_working_on",
    skill: "AIRSPEED_CONTROL",
    status: "Needs Coaching",
    source: "debrief",
    statement: "Airspeed drifted high on the base-to-final turn.",
    dismissed: false,
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  } as TrainingSignal;
}

function radioAssignment(overrides: Partial<RadioPracticeAssignment> = {}): RadioPracticeAssignment {
  return {
    id: "radio-1",
    organizationId: "org-1",
    studentId: "student-1",
    assignedBy: null,
    scenarioId: "initial-callup-ground",
    status: "assigned",
    transcript: null,
    correct: null,
    matchedElements: null,
    attempts: 0,
    completedAt: null,
    ...overrides,
  } as unknown as RadioPracticeAssignment;
}

/** Minimal stub -- only the methods buildProductionTrainProps's call graph actually invokes. */
function stubRepo(overrides: {
  signals?: TrainingSignal[];
  radioAssignments?: RadioPracticeAssignment[];
} = {}): Repository {
  const signals = overrides.signals ?? [];
  const radioAssignments = overrides.radioAssignments ?? [];
  return {
    listFlights: async () => [],
    listTrainingItems: async () => [],
    listReservations: async () => [],
    getDebriefByFlight: async () => null,
    listTrainingSignals: async () => signals,
    getUser: async () => null,
    listMembershipsForUser: async () => [{ organizationId: "org-1", certificateType: null }],
    listFlightTasks: async () => [],
    listRadioPracticeAssignments: async () => radioAssignments,
  } as unknown as Repository;
}

describe("buildProductionTrainProps — no empty quote", () => {
  it("populates evidence from the real TrainingSignal statement in the weakest-skill fallback, instead of an empty string", async () => {
    const props = await buildProductionTrainProps(stubRepo({ signals: [signal()] }), viewer(), HREFS);
    expect(props.recommended).not.toBeNull();
    expect(props.recommended!.evidence).not.toBeNull();
    expect(props.recommended!.evidence!.text).toBe("Airspeed drifted high on the base-to-final turn.");
    expect(props.recommended!.evidence!.text.length).toBeGreaterThan(0);
  });

  it("has no recommendation at all (and therefore no evidence block) when there are no signals", async () => {
    const props = await buildProductionTrainProps(stubRepo(), viewer(), HREFS);
    expect(props.recommended).toBeNull();
  });
});

describe("buildProductionTrainProps — Review/Quiz/Ask stay visible as a known gap", () => {
  it("shows the disabled secondary actions even without a contested objective (the weakest-skill fallback)", async () => {
    const props = await buildProductionTrainProps(stubRepo({ signals: [signal()] }), viewer(), HREFS);
    expect(props.secondaryActions).toBeDefined();
    expect(props.secondaryActions!.map((a) => a.label)).toEqual(["Review", "Quiz", "Ask"]);
    expect(props.secondaryActions!.every((a) => a.disabled)).toBe(true);
  });

  it("omits secondary actions when there's no recommendation to attach them to", async () => {
    const props = await buildProductionTrainProps(stubRepo(), viewer(), HREFS);
    expect(props.secondaryActions).toBeUndefined();
  });
});

describe("buildProductionTrainProps — Radio Call Practice", () => {
  it("surfaces an assigned radio-practice item via afterHeader", async () => {
    const props = await buildProductionTrainProps(stubRepo({ radioAssignments: [radioAssignment()] }), viewer(), HREFS);
    expect(props.afterHeader).toBeTruthy();
  });

  it("omits afterHeader entirely for a student with no radio practice assigned or completed, rather than an empty card", async () => {
    const props = await buildProductionTrainProps(stubRepo(), viewer(), HREFS);
    expect(props.afterHeader).toBeUndefined();
  });

  it("surfaces even when there's otherwise no skill recommendation -- the two are independent", async () => {
    const props = await buildProductionTrainProps(stubRepo({ radioAssignments: [radioAssignment({ status: "completed", correct: true })] }), viewer(), HREFS);
    expect(props.recommended).toBeNull();
    expect(props.afterHeader).toBeTruthy();
  });
});
