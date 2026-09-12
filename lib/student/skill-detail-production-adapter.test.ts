import { describe, expect, it } from "vitest";
import { buildProductionSkillDetailProps } from "./skill-detail-production-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { Organization, TrainingSignal } from "@/lib/types";

const STUDENT_ID = "student-1";

function organization(overrides: Partial<Organization> = {}): Organization {
  return {
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
    ...overrides,
  };
}

function viewer(): Viewer {
  return {
    user: { id: STUDENT_ID, name: "Regular Student", email: "s@example.com", authUserId: "s@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
    organization: organization(),
    role: "student",
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
    flightDate: "2026-08-20",
    category: "LANDINGS",
    skill: "CROSSWIND_LANDING",
    status: "NEEDS_COACHING",
    source: "INSTRUCTOR",
    statement: "Drifting right in the flare.",
    dismissed: false,
    ...overrides,
  } as TrainingSignal;
}

function fakeRepo(signals: TrainingSignal[]): Repository {
  return {
    listTrainingSignals: async () => signals,
    listMembershipsForUser: async () => [],
    listFlights: async () => [],
    listTrainingItems: async () => [],
    listReservations: async () => [],
    getDebriefByFlight: async () => null,
    getInstructor: async () => ({ id: "cfi-1", name: "Danny Franks" }),
  } as unknown as Repository;
}

describe("buildProductionSkillDetailProps — trainHref is genuinely skill-specific", () => {
  it("routes a radio-communications skill to Radio Practice, not the generic Train hub", async () => {
    const repo = fakeRepo([
      trainingSignal({ id: "a", skill: "RADIO_COMMUNICATIONS" }),
      trainingSignal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightDate: "2026-08-21" }),
    ]);
    const props = await buildProductionSkillDetailProps(repo, viewer(), "RADIO_COMMUNICATIONS", {
      trainHref: "/train",
      chairFlyHref: "/train/chair-fly",
      radioPracticeHref: "/train/radio-practice",
    });
    expect(props?.trainHref).toBe("/train/radio-practice");
  });

  it("routes Crosswind Landings to Chair Fly -- the one real authored scenario", async () => {
    const repo = fakeRepo([
      trainingSignal({ id: "a", skill: "CROSSWIND_LANDING" }),
      trainingSignal({ id: "b", skill: "CROSSWIND_LANDING", flightDate: "2026-08-21" }),
    ]);
    const props = await buildProductionSkillDetailProps(repo, viewer(), "CROSSWIND_LANDING", {
      trainHref: "/train",
      chairFlyHref: "/train/chair-fly",
      radioPracticeHref: "/train/radio-practice",
    });
    expect(props?.trainHref).toBe("/train/chair-fly");
  });

  it("falls back to the generic Train hub for a skill with no real matching activity -- never a fabricated link", async () => {
    const repo = fakeRepo([
      trainingSignal({ id: "a", skill: "STEEP_TURNS" }),
      trainingSignal({ id: "b", skill: "STEEP_TURNS", flightDate: "2026-08-21" }),
    ]);
    const props = await buildProductionSkillDetailProps(repo, viewer(), "STEEP_TURNS", {
      trainHref: "/train",
      chairFlyHref: "/train/chair-fly",
      radioPracticeHref: "/train/radio-practice",
    });
    expect(props?.trainHref).toBe("/train");
  });

  it("falls back to the generic Train hub when the caller omits chairFlyHref/radioPracticeHref (today: /v2)", async () => {
    const repo = fakeRepo([
      trainingSignal({ id: "a", skill: "RADIO_COMMUNICATIONS" }),
      trainingSignal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightDate: "2026-08-21" }),
    ]);
    const props = await buildProductionSkillDetailProps(repo, viewer(), "RADIO_COMMUNICATIONS", { trainHref: "/v2/train" });
    expect(props?.trainHref).toBe("/v2/train");
  });
});
