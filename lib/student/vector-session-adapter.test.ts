import { describe, expect, it } from "vitest";
import { buildVectorSessionProps } from "./vector-session-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { Debrief, FlightWithRelations, TrainingSignal } from "@/lib/types";

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

function debrief(overrides: Partial<Debrief["structuredResult"]> = {}): Debrief {
  return {
    id: "debrief-1",
    flightId: "flight-1",
    transcript: "transcript",
    audioDurationSeconds: 60,
    analyzedWith: "mock",
    guidanceMode: "freeform",
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

function trainingSignal(overrides: Partial<TrainingSignal> = {}): TrainingSignal {
  return {
    id: "signal-1",
    organizationId: "org-1",
    studentId: STUDENT_ID,
    instructorId: "cfi-1",
    aircraftId: null,
    flightId: "flight-1",
    debriefId: "debrief-1",
    flightDate: "2026-08-20",
    category: "MANEUVERS",
    skill: "STEEP_TURNS",
    status: "NEEDS_COACHING",
    source: "INSTRUCTOR",
    statement: "Lost thirty feet in the turn.",
    dismissed: false,
    ...overrides,
  } as TrainingSignal;
}

function fakeRepo(opts: { lastFlight?: FlightWithRelations | null; lastDebrief?: Debrief | null; signals?: TrainingSignal[] }): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => [],
    listReservations: async () => [],
    getDebriefByFlight: async () => opts.lastDebrief ?? null,
    listTrainingSignals: async () => opts.signals ?? [],
  } as unknown as Repository;
}

describe("buildVectorSessionProps", () => {
  it("resolves real, current-student evidence for the requested skill -- never a fixture", async () => {
    const repo = fakeRepo({ signals: [trainingSignal({ statement: "Real evidence for this student." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "STEEP_TURNS", HREFS);
    expect(props.evidence?.text).toBe("Real evidence for this student.");
  });

  it("never surfaces evidence for a different skill than the one requested", async () => {
    const repo = fakeRepo({ signals: [trainingSignal({ skill: "CROSSWIND_LANDING", statement: "Wrong skill entirely." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "STEEP_TURNS", HREFS);
    expect(props.evidence).toBeNull();
  });

  it("hands off to Chair Fly only when the contested objective actually resolves to the requested skill", async () => {
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Crosswind Landings", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
    });
    const matching = await buildVectorSessionProps(repo, viewer(), "CROSSWIND_LANDING", HREFS);
    expect(matching.capability).toEqual({ kind: "chair-fly" });

    // A stale/bookmarked URL for a DIFFERENT skill must not borrow this
    // contested objective's Chair Fly drill.
    const mismatched = await buildVectorSessionProps(repo, viewer(), "STEEP_TURNS", HREFS);
    expect(mismatched.capability.kind).not.toBe("chair-fly");
  });

  it("hands off to Radio Practice for RADIO_COMMUNICATIONS", async () => {
    const repo = fakeRepo({});
    const props = await buildVectorSessionProps(repo, viewer(), "RADIO_COMMUNICATIONS", HREFS);
    expect(props.capability).toEqual({ kind: "radio-practice" });
  });

  it("runs Vector's own grounded check for a skill with no interactive engine, with real curated guidance attached", async () => {
    const repo = fakeRepo({});
    const props = await buildVectorSessionProps(repo, viewer(), "STEEP_TURNS", HREFS);
    expect(props.capability.kind).toBe("check");
    expect(props.capability.kind === "check" && props.capability.guidance?.checkQuestion).toBeTruthy();
  });

  it("offers Chair Fly as a bonus next step whenever an authored scenario exists for the skill, even outside the check branch's own entry gate", async () => {
    const repo = fakeRepo({});
    const props = await buildVectorSessionProps(repo, viewer(), "CROSSWIND_LANDING", HREFS);
    expect(props.hasChairFlyOption).toBe(true);
  });

  it("flags a physical/stick-and-rudder skill so the session can frame it honestly", async () => {
    const repo = fakeRepo({});
    const physical = await buildVectorSessionProps(repo, viewer(), "STEEP_TURNS", HREFS);
    expect(physical.isPhysicalSkill).toBe(true);

    const knowledge = await buildVectorSessionProps(repo, viewer(), "EMERGENCY_PROCEDURES", HREFS);
    expect(knowledge.isPhysicalSkill).toBe(false);
  });

  it("degrades honestly for the 'general' fallback -- no evidence, no chair-fly option, null guidance", async () => {
    const repo = fakeRepo({});
    const props = await buildVectorSessionProps(repo, viewer(), "general", HREFS);
    expect(props.evidence).toBeNull();
    expect(props.hasChairFlyOption).toBe(false);
    expect(props.isPhysicalSkill).toBe(false);
    expect(props.capability).toEqual({ kind: "check", guidance: null });
    expect(props.skillLabel).toBe("this focus");
  });
});
