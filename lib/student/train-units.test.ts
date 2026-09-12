import { afterEach, describe, expect, it } from "vitest";
import { buildTrainingPlan, resolveOwnedTrainingItem, resolveTrainingItemSkill, resolveTrainingUnitEvidence } from "./train-units";
import type { Repository } from "@/lib/data/types";
import type { Debrief, FlightTask, FlightWithRelations, TrainingItem, TrainingSignal } from "@/lib/types";

const STUDENT_ID = "student-1";
const CROSSWIND_SENTENCE = "The first two landings were a little squirrelly in the crosswind, but I got the feel for it by the fourth one.";

function trainingItem(overrides: Partial<TrainingItem> = {}): TrainingItem {
  return {
    id: "item-1",
    flightId: "flight-1",
    debriefId: "debrief-1",
    category: "keep_working_on",
    description: CROSSWIND_SENTENCE,
    done: false,
    completedAt: null,
    visibility: "shared",
    createdAt: "2026-08-28T20:00:00.000Z",
    ...overrides,
  };
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
    flightDate: "2026-08-28",
    category: "LANDINGS",
    skill: "STABILIZED_APPROACH",
    status: "NEEDS_COACHING",
    source: "STUDENT_AND_INSTRUCTOR",
    statement: CROSSWIND_SENTENCE,
    dismissed: false,
    ...overrides,
  } as TrainingSignal;
}

describe("resolveTrainingItemSkill — strongest structured evidence first, never an LLM guess", () => {
  it("prefers a FlightTask actually assigned/flown on this flight over any text-matched candidate", () => {
    const item = trainingItem();
    const signals = [
      trainingSignal({ id: "a", skill: "STABILIZED_APPROACH" }),
      trainingSignal({ id: "b", skill: "CROSSWIND_LANDING" }),
    ];
    const skill = resolveTrainingItemSkill(item, signals, new Set(["STABILIZED_APPROACH"]));
    expect(skill).toBe("STABILIZED_APPROACH");
  });

  it("narrows to the most specific skill among this exact sentence's own TrainingSignal rows when no FlightTask evidence exists", () => {
    const item = trainingItem();
    const signals = [
      trainingSignal({ id: "a", skill: "STABILIZED_APPROACH" }),
      trainingSignal({ id: "b", skill: "CROSSWIND_LANDING" }),
    ];
    const skill = resolveTrainingItemSkill(item, signals, new Set());
    expect(skill).toBe("CROSSWIND_LANDING");
  });

  it("falls back to matchSkills() directly, narrowed the same way, when no TrainingSignal exists for this exact sentence", () => {
    const item = trainingItem({ debriefId: "debrief-no-signals" });
    const skill = resolveTrainingItemSkill(item, [], new Set());
    expect(skill).toBe("CROSSWIND_LANDING");
  });

  it("returns null, honestly, when nothing resolves at all", () => {
    const item = trainingItem({ description: "Generally a good flight today." });
    const skill = resolveTrainingItemSkill(item, [], new Set());
    expect(skill).toBeNull();
  });
});

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

function fakeRepo(opts: {
  items?: TrainingItem[];
  signals?: TrainingSignal[];
  flightTasks?: FlightTask[];
  lastFlight?: FlightWithRelations | null;
  lastDebrief?: Debrief | null;
}): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => opts.items ?? [],
    listReservations: async () => [],
    getDebriefByFlight: async () => opts.lastDebrief ?? null,
    listTrainingSignals: async () => opts.signals ?? [],
    listFlightTasks: async () => opts.flightTasks ?? [],
    listMembershipsForUser: async () => [],
  } as unknown as Repository;
}

describe("buildTrainingPlan", () => {
  it("collapses two TrainingItems that resolve to the same skill into one unit -- first occurrence wins", async () => {
    const items = [
      trainingItem({ id: "item-1", description: CROSSWIND_SENTENCE }),
      trainingItem({ id: "item-2", description: "Crosswind correction was late again on the second landing." }),
    ];
    const repo = fakeRepo({ items });
    const plan = await buildTrainingPlan(repo, STUDENT_ID);
    const allSkills = [plan.startHere, ...plan.alsoTrain, ...plan.more].filter(Boolean).map((u) => u!.skill);
    expect(allSkills.filter((s) => s === "CROSSWIND_LANDING")).toHaveLength(1);
    expect(plan.startHere?.id).toBe("item-1");
  });

  it("ranks a recurring (Needs Coaching) skill ahead of a brand-new (Introduced) one for Start Here", async () => {
    const items = [
      trainingItem({ id: "recurring-item", description: "Radio calls were rushed on downwind again." }),
      trainingItem({ id: "new-item", description: "Steep turns lost some altitude in the second one.", flightId: "flight-1" }),
    ];
    const signals = [
      // Two prior flights already flagged radio communications -- a real recurring "Needs Coaching" progression.
      trainingSignal({ id: "s1", skill: "RADIO_COMMUNICATIONS", flightId: "flight-0", flightDate: "2026-08-01", statement: "old radio note" }),
      trainingSignal({ id: "s2", skill: "RADIO_COMMUNICATIONS", flightId: "flight-1", flightDate: "2026-08-28", statement: "Radio calls were rushed on downwind again." }),
      trainingSignal({ id: "s3", skill: "STEEP_TURNS", flightId: "flight-1", flightDate: "2026-08-28", statement: "Steep turns lost some altitude in the second one." }),
    ];
    const repo = fakeRepo({ items, signals });
    const plan = await buildTrainingPlan(repo, STUDENT_ID);
    expect(plan.startHere?.skill).toBe("RADIO_COMMUNICATIONS");
  });

  it("caps immediately-visible units at 3 (1 start-here + 2 also-train) and keeps the rest reachable, never silently dropped", async () => {
    const descriptions = [
      "Radio calls were rushed on downwind.",
      "Steep turns lost some altitude in the second one.",
      "Emergency procedures -- forgot to trim for best glide.",
      "Slow flight -- corrected a dropping wing with aileron instead of rudder.",
    ];
    const items = descriptions.map((description, i) => trainingItem({ id: `item-${i}`, description }));
    const repo = fakeRepo({ items });
    const plan = await buildTrainingPlan(repo, STUDENT_ID);
    const visibleCount = (plan.startHere ? 1 : 0) + plan.alsoTrain.length;
    expect(visibleCount).toBe(3);
    expect(plan.more).toHaveLength(1);
  });

  it("returns an empty plan, honestly, when there's nothing to train on", async () => {
    const repo = fakeRepo({ items: [] });
    const plan = await buildTrainingPlan(repo, STUDENT_ID);
    expect(plan).toEqual({ startHere: null, alsoTrain: [], more: [] });
  });
});

describe("resolveOwnedTrainingItem — possession of an id is never sufficient authorization", () => {
  it("resolves a real item that belongs to this student", async () => {
    const repo = fakeRepo({ items: [trainingItem()] });
    const result = await resolveOwnedTrainingItem(repo, STUDENT_ID, "item-1");
    expect(result?.skill).toBe("CROSSWIND_LANDING");
  });

  it("returns null for an id the ownership-scoped query doesn't return -- never falls back to an unscoped lookup", async () => {
    // Simulates listTrainingItems({studentId}) correctly scoping to the
    // caller's own flights (see postgres-repository.ts's JOIN) -- a
    // different student's repo view simply never contains this item.
    const repo = fakeRepo({ items: [] });
    const result = await resolveOwnedTrainingItem(repo, "someone-else", "item-1");
    expect(result).toBeNull();
  });

  it("returns null for a CFI-only item -- visibility is enforced, not just ownership", async () => {
    const repo = fakeRepo({ items: [trainingItem({ visibility: "instructor_only" })] });
    const result = await resolveOwnedTrainingItem(repo, STUDENT_ID, "item-1");
    expect(result).toBeNull();
  });

  it("returns null for a before_next_flight item -- only keep_working_on items become Vector training units", async () => {
    const repo = fakeRepo({ items: [trainingItem({ category: "before_next_flight" })] });
    const result = await resolveOwnedTrainingItem(repo, STUDENT_ID, "item-1");
    expect(result).toBeNull();
  });

  it("no longer resolves evidence interpretation itself -- that's a separate, explicit call (resolveTrainingUnitEvidence), never bundled into ownership resolution", async () => {
    const repo = fakeRepo({ items: [trainingItem()] });
    const result = await resolveOwnedTrainingItem(repo, STUDENT_ID, "item-1");
    expect(result).toEqual({ item: trainingItem(), skill: "CROSSWIND_LANDING" });
  });
});

describe("resolveTrainingUnitEvidence — the one shared evidence path for both Train's card list and the Vector session", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = original;
  });

  it("degrades to no instructor quote and no mechanism, honestly, without an API key -- never a skill-derived guess", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await resolveTrainingUnitEvidence(
      [{ taskLabel: "Crosswind landings", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "You're still relaxing the correction once you get into the flare." }],
      [],
      "CROSSWIND_LANDING",
      "Crosswind landings",
      "Jake",
    );
    expect(result).toEqual({ instructorQuote: null, mechanism: null });
  });

  it("returns no evidence, honestly, when there are no candidate quotes at all", async () => {
    const result = await resolveTrainingUnitEvidence([], [], "STEEP_TURNS", "Steep turns", "Jake");
    expect(result).toEqual({ instructorQuote: null, mechanism: null });
  });
});
