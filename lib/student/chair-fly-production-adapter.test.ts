import { describe, expect, it } from "vitest";
import { buildChairFlyDrillForUnit } from "./chair-fly-production-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { Debrief, FlightWithRelations } from "@/lib/types";

const STUDENT_ID = "student-1";

function viewer(): Viewer {
  return {
    user: { id: STUDENT_ID, name: "Regular Student", email: "s@example.com", authUserId: "s@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
    organization: { id: "org-1", name: "Falcon Aviation", kind: "school", defaultGuidanceMode: "freeform", stripeCustomerId: null, stripeSubscriptionId: null, subscriptionStatus: null, subscriptionPlan: null, subscriptionQuantity: 1, demoExpiresAt: null, createdAt: "2026-01-01T00:00:00.000Z" },
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
    flightDate: "2026-08-28",
    durationMinutes: 60,
    instructorId: "cfi-1",
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: null,
    createdAt: "2026-08-28T20:00:00.000Z",
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
    createdAt: "2026-08-28T20:00:00.000Z",
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

function fakeRepo(opts: { lastFlight?: FlightWithRelations | null; lastDebrief?: Debrief | null }): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => [],
    listReservations: async () => [],
    getDebriefByFlight: async () => opts.lastDebrief ?? null,
    listTrainingSignals: async () => [],
  } as unknown as Repository;
}

const CROSSWIND_UNIT = {
  skill: "CROSSWIND_LANDING" as const,
  skillLabel: "Crosswind landings",
  evidence: { label: "Danny · Aug 28", text: "The first two landings were a little squirrelly in the crosswind." },
};

describe("buildChairFlyDrillForUnit", () => {
  it("returns null for a skill with no authored scenario -- never fabricates one", async () => {
    const repo = fakeRepo({});
    const drill = await buildChairFlyDrillForUnit(repo, viewer(), {
      skill: "STEEP_TURNS",
      skillLabel: "Steep turns",
      evidence: { label: "Danny · Aug 28", text: "Lost some altitude in the second one." },
    });
    expect(drill).toBeNull();
  });

  it("frames the drill from this unit's own debrief evidence when no dual-assessment comparison exists (the freeform case)", async () => {
    const repo = fakeRepo({});
    const drill = await buildChairFlyDrillForUnit(repo, viewer(), CROSSWIND_UNIT);
    expect(drill).not.toBeNull();
    expect(drill!.reason.studentLabel).toBe("");
    expect(drill!.reason.instructorLabel).toBe("");
    expect(drill!.reason.evidence).toBe(CROSSWIND_UNIT.evidence.text);
    expect(drill!.reason.line).toContain(CROSSWIND_UNIT.evidence.text);
    expect(drill!.reason.line).not.toMatch(/you called it/i);
  });

  it("frames the drill from the real rated comparison when this unit's skill IS the last debrief's contested objective", async () => {
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Crosswind Landings", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "Watch the correction through rollout." }] }),
    });
    const drill = await buildChairFlyDrillForUnit(repo, viewer(), CROSSWIND_UNIT);
    expect(drill).not.toBeNull();
    // The real, rated comparison framing -- unlike the evidence-only path,
    // this is populated (recommendedDrill()'s own pre-existing behavior,
    // unchanged here).
    expect(drill!.reason.studentLabel).not.toBe("");
    expect(drill!.reason.instructorLabel).not.toBe("");
  });

  it("never borrows a contested comparison for a different skill than this unit's own", async () => {
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Steep turns", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "Unrelated note." }] }),
    });
    const drill = await buildChairFlyDrillForUnit(repo, viewer(), CROSSWIND_UNIT);
    expect(drill).not.toBeNull();
    // Falls back to the evidence-only framing -- the contested objective is
    // about a different skill entirely.
    expect(drill!.reason.studentLabel).toBe("");
    expect(drill!.reason.evidence).toBe(CROSSWIND_UNIT.evidence.text);
  });
});
