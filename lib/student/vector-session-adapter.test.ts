import { describe, expect, it } from "vitest";
import { buildVectorSessionProps } from "./vector-session-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { Debrief, FlightWithRelations, RadioPracticeAssignment, TrainingItem, TrainingSignal } from "@/lib/types";

const STUDENT_ID = "student-1";
const HREFS = { chairFlyHref: "/train/chair-fly", radioPracticeHref: "/train/radio-practice" };

function viewer(): Viewer {
  return {
    user: { id: STUDENT_ID, name: "Regular Student", email: "s@example.com", authUserId: "s@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
    organization: {
      id: "org-1",
      name: "Falcon Aviation",
      kind: "school",
      defaultGuidanceMode: "freeform",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: null,
      subscriptionQuantity: 1,
      demoExpiresAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    role: "student",
  } as unknown as Viewer;
}

function flight(overrides: Partial<FlightWithRelations> = {}): FlightWithRelations {
  return {
    id: "flight-1",
    userId: STUDENT_ID,
    organizationId: "org-1",
    aircraftId: "aircraft-1",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: "2026-08-20",
    durationMinutes: 60,
    instructorId: "cfi-1",
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: null,
    createdAt: "2026-08-20T20:00:00.000Z",
    aircraft: { id: "aircraft-1", tailNumber: "N123AB", type: "Cessna 172", make: "Cessna", model: "172", homeAirport: "KFFZ", organizationId: "org-1", status: "active", externalProvider: null, externalId: null },
    instructor: { id: "cfi-1", name: "Danny Franks" },
    ...overrides,
  } as FlightWithRelations;
}

function trainingItem(overrides: Partial<TrainingItem> = {}): TrainingItem {
  return {
    id: "item-1",
    flightId: "flight-1",
    debriefId: "debrief-1",
    category: "keep_working_on",
    description: "Lost thirty feet in the turn.",
    done: false,
    completedAt: null,
    visibility: "shared",
    createdAt: "2026-08-20T20:00:00.000Z",
    ...overrides,
  };
}

function debrief(overrides: Partial<Debrief["structuredResult"]> = {}): Debrief {
  return {
    id: "debrief-1",
    flightId: "flight-1",
    transcript: "transcript",
    audioDurationSeconds: 60,
    analyzedWith: "mock",
    guidanceMode: "guided",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: "2026-08-20T20:00:00.000Z",
    structuredResult: {
      flightSummary: "",
      narrativeRecap: "",
      whatWeDid: [],
      wentWell: [],
      needsWork: [],
      instructorGuidance: [],
      instructorAssistance: [],
      riskManagementNotes: [],
      assessmentDifferences: [],
      actionItems: [],
      nextLessonFocus: [],
      studyReferences: [],
      nextFlightCue: "",
      nextFlightCueContext: "",
      ...overrides,
    },
  } as Debrief;
}

function radioAssignment(overrides: Partial<RadioPracticeAssignment> = {}): RadioPracticeAssignment {
  return {
    id: "assignment-1",
    organizationId: "org-1",
    studentId: STUDENT_ID,
    assignedBy: null,
    scenarioId: "initial-atis",
    status: "assigned",
    transcript: null,
    correct: null,
    matchedElements: null,
    attempts: 0,
    trainingItemId: null,
    completedAt: null,
    createdAt: "2026-08-20T20:00:00.000Z",
    ...overrides,
  };
}

function fakeRepo(opts: {
  items?: TrainingItem[];
  signals?: TrainingSignal[];
  lastFlight?: FlightWithRelations | null;
  lastDebrief?: Debrief | null;
  radioAssignments?: RadioPracticeAssignment[];
}): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => opts.items ?? [],
    listReservations: async () => [],
    getDebriefByFlight: async () => opts.lastDebrief ?? null,
    listTrainingSignals: async () => opts.signals ?? [],
    listFlightTasks: async () => [],
    listRadioPracticeAssignments: async () => opts.radioAssignments ?? [],
  } as unknown as Repository;
}

describe("buildVectorSessionProps", () => {
  it("resolves this exact item's own real evidence -- never a fixture", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Steep turns lost some altitude in the second one." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.evidence.text).toBe("Steep turns lost some altitude in the second one.");
  });

  it("returns null -- not a fixture, not another item's evidence -- for an id that doesn't resolve to an owned, skill-resolvable item", async () => {
    const repo = fakeRepo({ items: [] });
    const props = await buildVectorSessionProps(repo, viewer(), "nonexistent-item", HREFS);
    expect(props).toBeNull();
  });

  it("diagnoses via curated Q&A first, even for a skill with a Chair Fly engine, when no mechanism is known yet (freeform debrief)", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Crosswind correction was late on the last two landings." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.strategy.kind).toBe("check");
  });

  it("goes straight to Chair Fly, no preliminary question, when this unit's own mechanism is explicitly known from a real dual-assessment note", async () => {
    const repo = fakeRepo({
      items: [trainingItem({ description: "Crosswind correction was late on the last two landings." })],
      lastDebrief: debrief({
        assessmentDifferences: [
          { taskLabel: "Crosswind landings", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "You're still relaxing the correction once you get into the flare." },
        ],
      }),
    });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.strategy).toEqual({ kind: "chair-fly" });
  });

  it("diagnoses an ambiguous communications gap via the real Radio Practice activity itself", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Radio calls on downwind were rushed." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.strategy).toEqual({ kind: "radio-practice", mode: "diagnose" });
    expect(props?.radioScenarioId).toBeTruthy();
  });

  it("never dead-ends the exact browser-acceptance sentence, whichever of its two plausible skills wins text-matching", async () => {
    // This sentence genuinely contains two skill-matching words ("radio"
    // and "emergency") with no FlightTask/TrainingSignal evidence to
    // disambiguate them here -- pure keyword matching can legitimately
    // land on either TOWER_READBACKS or EMERGENCY_PROCEDURES. The one
    // thing that must never happen, whichever wins, is a strategy outside
    // the five legitimate kinds resolveVectorStrategy can ever produce --
    // there is no "nothing prepared" variant at all anymore.
    const repo = fakeRepo({
      items: [trainingItem({ description: "I need to work on talking on the radio more confidently during the emergency scenario." })],
    });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props).not.toBeNull();
    expect(["chair-fly", "radio-practice", "coach", "check", "transfer"]).toContain(props?.strategy.kind);
  });

  it("offers Vector's own grounded diagnostic question for an item with no rehearsal engine at all", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Steep turns lost some altitude in the second one." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.strategy.kind).toBe("check");
    expect(props?.strategy.kind === "check" && props.strategy.question.prompt).toBeTruthy();
  });

  it("surfaces an already-completed, linked Radio Practice attempt as real activity evidence -- re-fetched server-side, never trusted from the client", async () => {
    const repo = fakeRepo({
      items: [trainingItem({ description: "Radio calls on downwind were rushed." })],
      radioAssignments: [
        radioAssignment({
          id: "assignment-linked",
          trainingItemId: "item-1",
          status: "completed",
          correct: false,
          matchedElements: [{ description: "altitude restriction readback", matched: false }],
        }),
      ],
    });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.strategy.kind).toBe("transfer");
    expect(props?.strategy.kind === "transfer" && props.strategy.objective).toContain("altitude restriction readback");
  });

  it("surfaces an incomplete, linked Radio Practice attempt to resume, instead of creating a duplicate", async () => {
    const repo = fakeRepo({
      items: [trainingItem({ description: "Radio calls on downwind were rushed." })],
      radioAssignments: [radioAssignment({ id: "assignment-pending", trainingItemId: "item-1", status: "assigned" })],
    });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.pendingRadioPracticeAssignmentId).toBe("assignment-pending");
    expect(props?.strategy.kind).toBe("radio-practice");
  });

  it("ignores a Radio Practice assignment linked to a different training item", async () => {
    const repo = fakeRepo({
      items: [trainingItem({ description: "Radio calls on downwind were rushed." })],
      radioAssignments: [radioAssignment({ id: "assignment-other", trainingItemId: "some-other-item", status: "completed", correct: true })],
    });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.pendingRadioPracticeAssignmentId).toBeNull();
    expect(props?.strategy).toEqual({ kind: "radio-practice", mode: "diagnose" });
  });

  it("flags a physical/stick-and-rudder skill so the session can frame it honestly", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Steep turns lost some altitude in the second one." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.isPhysicalSkill).toBe(true);
  });

  it("never flags a knowledge/judgment skill as physical", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Rushed the checklist flow during the emergency procedure." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.isPhysicalSkill).toBe(false);
  });

  it("returns null for a CFI-only item -- possession of the id is never sufficient authorization", async () => {
    const repo = fakeRepo({ items: [trainingItem({ visibility: "instructor_only" })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props).toBeNull();
  });
});
