import { describe, expect, it } from "vitest";
import { buildVectorSessionProps } from "./vector-session-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { FlightWithRelations, TrainingItem, TrainingSignal } from "@/lib/types";

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

function fakeRepo(opts: { items?: TrainingItem[]; signals?: TrainingSignal[]; lastFlight?: FlightWithRelations | null }): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => opts.items ?? [],
    listReservations: async () => [],
    getDebriefByFlight: async () => null,
    listTrainingSignals: async () => opts.signals ?? [],
    listFlightTasks: async () => [],
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

  it("hands off to the real Chair Fly engine when this item's own skill has an authored scenario", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Crosswind correction was late on the last two landings." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.capability).toEqual({ kind: "chair-fly" });
  });

  it("hands off to Radio Practice for an item resolving to RADIO_COMMUNICATIONS", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Radio calls on downwind were rushed." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.capability).toEqual({ kind: "radio-practice" });
  });

  it("never dead-ends the exact browser-acceptance sentence, whichever of its two plausible skills wins text-matching", async () => {
    // This sentence genuinely contains two skill-matching words ("radio"
    // and "emergency") with no FlightTask/TrainingSignal evidence to
    // disambiguate them here -- pure keyword matching can legitimately
    // land on either TOWER_READBACKS (now a real Radio Practice route,
    // the fix this test guards) or EMERGENCY_PROCEDURES (real curated
    // check content). The one thing that must never happen, whichever
    // wins, is the empty "nothing prepared" dead end this whole fix
    // exists to close.
    const repo = fakeRepo({
      items: [trainingItem({ description: "I need to work on talking on the radio more confidently during the emergency scenario." })],
    });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    const isDeadEnd = props?.capability.kind === "check" && props.capability.guidance === null;
    expect(isDeadEnd).toBe(false);
  });

  it("runs Vector's own grounded check for an item with no interactive engine, with real curated guidance attached", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Steep turns lost some altitude in the second one." })] });
    const props = await buildVectorSessionProps(repo, viewer(), "item-1", HREFS);
    expect(props?.capability.kind).toBe("check");
    expect(props?.capability.kind === "check" && props.capability.guidance?.checkQuestion).toBeTruthy();
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
