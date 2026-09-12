import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildProductionTrainProps } from "./train-production-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { FlightWithRelations, Organization, RadioPracticeAssignment, TrainingItem, User } from "@/lib/types";

const STUDENT_ID = "student-1";
const HREFS = { chairFlyHref: "/train/chair-fly", skillHref: (s: string) => `/progress/${s}` };

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
    aircraft: {
      id: "aircraft-1",
      tailNumber: "N123AB",
      type: "Cessna 172",
      make: "Cessna",
      model: "172",
      homeAirport: "KFFZ",
      organizationId: "org-1",
      status: "active",
      externalProvider: null,
      externalId: null,
    },
    instructor: { id: "cfi-1", name: "Danny Franks" },
    ...overrides,
  };
}

function trainingItem(overrides: Partial<TrainingItem> = {}): TrainingItem {
  return {
    id: "item-1",
    flightId: "flight-1",
    debriefId: "debrief-1",
    category: "keep_working_on",
    description: "Crosswind correction was late on the last two landings.",
    done: false,
    completedAt: null,
    visibility: "shared",
    createdAt: "2026-08-20T20:00:00.000Z",
    ...overrides,
  };
}

function fakeRepo(opts: {
  lastFlight?: FlightWithRelations | null;
  items?: TrainingItem[];
  radioAssignments?: RadioPracticeAssignment[];
  cfiUser?: User | null;
}): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => opts.items ?? [],
    listReservations: async () => [],
    getDebriefByFlight: async () => null,
    listTrainingSignals: async () => [],
    listMembershipsForUser: async () => [],
    listFlightTasks: async () => [],
    listRadioPracticeAssignments: async () => opts.radioAssignments ?? [],
    getUser: async () => opts.cfiUser ?? null,
  } as unknown as Repository;
}

describe("buildProductionTrainProps", () => {
  it("recommends this debrief's own Needs Work item, resolved to its most specific skill", async () => {
    const repo = fakeRepo({ items: [trainingItem()] });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    expect(props.recommended?.skillLabel).toBe("Crosswind landings");
  });

  it("always links Train's one button to /train/vector/<itemId> -- whether or not an authored Chair Fly scenario exists is decided one layer in, not here", async () => {
    const withoutScenario = await buildProductionTrainProps(
      fakeRepo({ items: [trainingItem({ id: "item-steep", description: "Steep turns lost some altitude in the second one." })] }),
      viewer(),
      HREFS,
    );
    expect(withoutScenario.vectorSession).toEqual({ buttonLabel: "Train with Vector", href: "/train/vector/item-steep" });

    const withScenario = await buildProductionTrainProps(fakeRepo({ items: [trainingItem({ id: "item-crosswind" })] }), viewer(), HREFS);
    expect(withScenario.vectorSession).toEqual({ buttonLabel: "Train with Vector", href: "/train/vector/item-crosswind" });
  });

  it("returns radioPractice: null when the caller omits radioPracticeHref (today: /v2's real-data branch, no /v2/practice/[id] yet)", async () => {
    const repo = fakeRepo({ items: [trainingItem()] });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    expect(props.radioPractice).toBeNull();
  });

  it("surfaces a pending CFI-assigned scenario with real provenance when radioPracticeHref is given", async () => {
    const repo = fakeRepo({
      items: [trainingItem()],
      radioAssignments: [
        {
          id: "assignment-1",
          organizationId: "org-1",
          studentId: STUDENT_ID,
          assignedBy: "cfi-1",
          scenarioId: "initial-atis",
          status: "assigned",
          transcript: null,
          correct: null,
          matchedElements: null,
          attempts: 0,
          completedAt: null,
          createdAt: "2026-08-21T00:00:00.000Z",
        },
      ],
      cfiUser: { id: "cfi-1", name: "Danny Franks", email: "danny@example.com", authUserId: "danny@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
    });
    const props = await buildProductionTrainProps(repo, viewer(), { ...HREFS, radioPracticeHref: "/train/radio-practice" });
    expect(props.radioPractice?.cfiRecommendation).toEqual({
      instructorFirstName: "Danny",
      scenarioTitle: expect.any(String),
      href: "/practice/assignment-1",
    });
    expect(props.radioPractice?.startHref).toBe("/train/radio-practice");
  });

  it("notes the Vector connection when the top unit resolves to radio communications, without inventing a second recommendation", async () => {
    const repo = fakeRepo({ items: [trainingItem({ description: "Radio calls on downwind were rushed and hard to understand." })] });
    const props = await buildProductionTrainProps(repo, viewer(), { ...HREFS, radioPracticeHref: "/train/radio-practice" });
    expect(props.recommended?.skillLabel).toBe("Radio communications");
    expect(props.radioPractice?.contextNote).toMatch(/radio communications/i);
  });

  it("never renders Review/Quiz/Ask disabled placeholder rows -- omitted entirely, not shown disabled", async () => {
    const repo = fakeRepo({ items: [trainingItem()] });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    expect(props.secondaryActions).toBeUndefined();
  });

  it("never returns a Still Working On list -- Vector's current-debrief plan is the whole point of production Train", async () => {
    const repo = fakeRepo({
      items: [
        trainingItem({ id: "a", description: "Crosswind correction was late on the last two landings." }),
        trainingItem({ id: "b", description: "Steep turns lost some altitude in the second one." }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    expect(props.stillWorkingOn).toBeUndefined();
  });

  it("surfaces up to two more current-debrief units as compact 'also train' cards", async () => {
    const repo = fakeRepo({
      items: [
        trainingItem({ id: "a", description: "Crosswind correction was late on the last two landings." }),
        trainingItem({ id: "b", description: "Radio calls on downwind were rushed and hard to understand." }),
        trainingItem({ id: "c", description: "Steep turns lost some altitude in the second one." }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    expect(props.alsoTrain).toHaveLength(2);
    expect(props.moreTrain).toEqual([]);
  });

  it("keeps every valid distinct current-debrief need reachable beyond the visible cap, via moreTrain", async () => {
    const repo = fakeRepo({
      items: [
        trainingItem({ id: "a", description: "Crosswind correction was late on the last two landings." }),
        trainingItem({ id: "b", description: "Radio calls on downwind were rushed and hard to understand." }),
        trainingItem({ id: "c", description: "Steep turns lost some altitude in the second one." }),
        trainingItem({ id: "d", description: "Forgot to trim for best glide during the emergency scenario." }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    expect(1 + props.alsoTrain!.length).toBe(3);
    expect(props.moreTrain).toHaveLength(1);
  });
});

describe("StudentTrain rendering with real production props", () => {
  it("always renders one real, clickable Vector control -- never a dead end, whether or not an authored Chair Fly scenario exists", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({ items: [trainingItem({ id: "item-steep", description: "Steep turns lost some altitude in the second one." })] });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Steep turns");
    expect(markup).toContain("Train with Vector");
    expect(markup).toContain('href="/train/vector/item-steep"');
  });

  it("never renders a Still Working On section, no matter how many open units exist", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      items: [
        trainingItem({ id: "a", description: "Crosswind correction was late on the last two landings." }),
        trainingItem({ id: "b", description: "Steep turns lost some altitude in the second one." }),
        trainingItem({ id: "c", description: "Slow flight -- corrected a dropping wing with aileron instead of rudder." }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).not.toContain("Still working on");
  });

  it("shows exactly one Start Here card and labels it plainly, not algorithmically", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({ items: [trainingItem()] });
    const props = await buildProductionTrainProps(repo, viewer(), { ...HREFS, radioPracticeHref: "/train/radio-practice" });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Start here");
    expect(markup).not.toContain("Top priority");
    const buttonCount = (markup.match(/Train with Vector/g) ?? []).length;
    expect(buttonCount).toBe(1);
  });

  it("renders each Also Train unit as its own compact card, each with its own working Vector link", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      items: [
        trainingItem({ id: "a", description: "Crosswind correction was late on the last two landings." }),
        trainingItem({ id: "b", description: "Radio calls on downwind were rushed and hard to understand." }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Also train");
    expect(markup).toContain("Radio communications");
    expect(markup).toContain('href="/train/vector/b"');
  });

  it("keeps additional current-debrief units behind progressive disclosure, never silently dropped", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      items: [
        trainingItem({ id: "a", description: "Crosswind correction was late on the last two landings." }),
        trainingItem({ id: "b", description: "Radio calls on downwind were rushed and hard to understand." }),
        trainingItem({ id: "c", description: "Steep turns lost some altitude in the second one." }),
        trainingItem({ id: "d", description: "Forgot to trim for best glide during the emergency scenario." }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), HREFS);
    // Not silently dropped at the data layer -- the fourth unit is a real
    // unit with its own working link, just not immediately visible.
    expect(props.moreTrain?.[0]?.vectorSession.href).toBe("/train/vector/d");
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("1 more from this debrief");
  });

  it("never duplicates the generic Radio Practice card when Vector's own primary action already routes to Radio Practice", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      items: [trainingItem({ description: "Radio calls on downwind were rushed and hard to understand." })],
      radioAssignments: [],
    });
    const props = await buildProductionTrainProps(repo, viewer(), { ...HREFS, radioPracticeHref: "/train/radio-practice" });
    expect(props.recommended?.skillLabel).toBe("Radio communications");
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).not.toContain('href="/train/radio-practice"');
    expect(markup).not.toContain("Other training");
  });

  it("renders the CFI-recommended scenario with real provenance and 'Start practice' copy -- never 'assign'", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      items: [trainingItem()],
      radioAssignments: [
        {
          id: "assignment-1",
          organizationId: "org-1",
          studentId: STUDENT_ID,
          assignedBy: "cfi-1",
          scenarioId: "initial-atis",
          status: "assigned",
          transcript: null,
          correct: null,
          matchedElements: null,
          attempts: 0,
          completedAt: null,
          createdAt: "2026-08-21T00:00:00.000Z",
        },
      ],
      cfiUser: { id: "cfi-1", name: "Danny Franks", email: "danny@example.com", authUserId: "danny@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
    });
    const props = await buildProductionTrainProps(repo, viewer(), { ...HREFS, radioPracticeHref: "/train/radio-practice" });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Danny recommends");
    expect(markup).toContain("Start practice");
    const visibleText = markup.replace(/href="[^"]*"/g, "");
    expect(visibleText.toLowerCase()).not.toMatch(/assign/);
  });

  it("always shows the generic Radio Practice entry point, reachable with no CFI recommendation at all", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({ items: [trainingItem()], radioAssignments: [] });
    const props = await buildProductionTrainProps(repo, viewer(), { ...HREFS, radioPracticeHref: "/train/radio-practice" });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Radio Practice");
    expect(markup).toContain('href="/train/radio-practice"');
  });
});
