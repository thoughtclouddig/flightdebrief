import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildProductionTrainProps } from "./train-production-adapter";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { Debrief, FlightWithRelations, Organization, RadioPracticeAssignment, TrainingSignal, User } from "@/lib/types";

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
    category: "LANDINGS",
    skill: "CROSSWIND_LANDING",
    status: "NEEDS_COACHING",
    source: "INSTRUCTOR",
    statement: "Drifting right in the flare.",
    dismissed: false,
    ...overrides,
  } as TrainingSignal;
}

function fakeRepo(opts: {
  lastFlight?: FlightWithRelations | null;
  lastDebrief?: Debrief | null;
  signals?: TrainingSignal[];
  radioAssignments?: RadioPracticeAssignment[];
  cfiUser?: User | null;
}): Repository {
  const lastFlight = opts.lastFlight === undefined ? flight() : opts.lastFlight;
  return {
    listFlights: async () => (lastFlight ? [lastFlight] : []),
    listTrainingItems: async () => [],
    listReservations: async () => [],
    getDebriefByFlight: async () => opts.lastDebrief ?? null,
    listTrainingSignals: async () => opts.signals ?? [],
    listMembershipsForUser: async () => [],
    listFlightTasks: async () => [],
    listRadioPracticeAssignments: async () => opts.radioAssignments ?? [],
    getUser: async () => opts.cfiUser ?? null,
  } as unknown as Repository;
}

describe("buildProductionTrainProps", () => {
  it("recommends the weakest open skill when there's no contested objective or recurring theme, using the shared computeRecommendedFocus ranking", async () => {
    const repo = fakeRepo({ signals: [trainingSignal()] });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(props.recommended?.skillLabel).toBe("Crosswind landings");
  });

  it("only offers Chair Fly when the contested objective has a real authored scenario", async () => {
    const repoWithoutAuthoredScenario = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Steep turns", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
      signals: [trainingSignal({ skill: "STEEP_TURNS" })],
    });
    const withoutScenario = await buildProductionTrainProps(repoWithoutAuthoredScenario, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(withoutScenario.vectorSession?.action).toBeNull();
    // Not a dead end -- an unsupported interactive skill still gets a real
    // Vector session (grounded coaching), just not the Chair Fly engine.
    expect(withoutScenario.vectorSession?.coaching).not.toBeNull();

    const repoWithAuthoredScenario = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Crosswind Landings", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
      signals: [trainingSignal()],
    });
    const withScenario = await buildProductionTrainProps(repoWithAuthoredScenario, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(withScenario.vectorSession?.action).toEqual({
      kind: "chair-fly",
      href: "/train/chair-fly",
      caption: "About 4 minutes",
    });
  });

  it("returns radioPractice: null when the caller omits radioPracticeHref (today: /v2's real-data branch, no /v2/practice/[id] yet)", async () => {
    const repo = fakeRepo({ signals: [trainingSignal()] });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(props.radioPractice).toBeNull();
  });

  it("surfaces a pending CFI-assigned scenario with real provenance when radioPracticeHref is given", async () => {
    const repo = fakeRepo({
      signals: [trainingSignal()],
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
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
      radioPracticeHref: "/train/radio-practice",
    });
    expect(props.radioPractice?.cfiRecommendation).toEqual({
      instructorFirstName: "Danny",
      scenarioTitle: expect.any(String),
      href: "/practice/assignment-1",
    });
    expect(props.radioPractice?.startHref).toBe("/train/radio-practice");
  });

  it("notes the Vector connection when the recommended skill is radio communications, without inventing a second recommendation", async () => {
    const repo = fakeRepo({
      signals: [
        trainingSignal({ id: "a", skill: "RADIO_COMMUNICATIONS", flightId: "flight-1" }),
        trainingSignal({ id: "b", skill: "RADIO_COMMUNICATIONS", flightId: "flight-2", flightDate: "2026-08-21" }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
      radioPracticeHref: "/train/radio-practice",
    });
    expect(props.recommended?.skillLabel).toBe("Radio communications");
    expect(props.radioPractice?.contextNote).toMatch(/radio communications/i);
  });

  it("never renders Review/Quiz/Ask disabled placeholder rows -- omitted entirely, not shown disabled", async () => {
    const repo = fakeRepo({ signals: [trainingSignal()] });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(props.secondaryActions).toBeUndefined();
  });

  it("never returns a Still Working On list -- Vector's one recommendation is the whole point of production Train", async () => {
    const repo = fakeRepo({
      signals: [
        trainingSignal({ id: "a", skill: "CROSSWIND_LANDING" }),
        trainingSignal({ id: "b", skill: "STEEP_TURNS", flightId: "flight-2" }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(props.stillWorkingOn).toBeUndefined();
  });
});

describe("StudentTrain rendering with real production props", () => {
  it("never shows a dead Chair Fly button when no authored scenario exists, and the recommendation still renders as a real, actionable Vector session", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Steep turns", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
      signals: [trainingSignal({ skill: "STEEP_TURNS" })],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).not.toContain("Start chair flying");
    expect(markup).toContain("Steep turns");
    // Not a dead end -- Vector still offers one real, clickable control even
    // with no interactive engine behind it (a button, since there's no href
    // to route to -- the reveal happens client-side).
    expect(markup).toContain("Train with Vector");
  });

  it("never renders a Still Working On section, no matter how many open skills exist", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      signals: [
        trainingSignal({ id: "a", skill: "CROSSWIND_LANDING" }),
        trainingSignal({ id: "b", skill: "STEEP_TURNS", flightId: "flight-2" }),
        trainingSignal({ id: "c", skill: "SLOW_FLIGHT", flightId: "flight-3" }),
      ],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).not.toContain("Still working on");
  });

  it("shows exactly one primary Vector control -- no second, equal-weight action competes with it", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Crosswind Landings", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
      signals: [trainingSignal()],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
      radioPracticeHref: "/train/radio-practice",
    });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    const buttonCount = (markup.match(/Train with Vector/g) ?? []).length;
    expect(buttonCount).toBe(1);
    // Radio Practice still appears, but only as the secondary "Other
    // training" entry -- never a second copy of the primary control.
    expect(markup).toContain("Other training");
  });

  it("never duplicates the generic Radio Practice card when Vector's own primary action already routes to Radio Practice", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      signals: [trainingSignal({ skill: "RADIO_COMMUNICATIONS" })],
      radioAssignments: [],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
      radioPracticeHref: "/train/radio-practice",
    });
    expect(props.vectorSession?.action).toEqual({ kind: "radio-practice", href: "/train/radio-practice" });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    // The primary button itself links to radio practice; the generic
    // "Other training" card offering the exact same href must not also
    // appear.
    const hrefCount = (markup.match(/href="\/train\/radio-practice"/g) ?? []).length;
    expect(hrefCount).toBe(1);
  });

  it("keeps the FAA source/url provenance intact through the Vector router, unchanged from lib/topics.ts's own citation", async () => {
    const { citationForSkill } = await import("@/lib/topics");
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Steep turns", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
      signals: [trainingSignal({ skill: "STEEP_TURNS" })],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    expect(props.vectorSession?.coaching?.citation).toEqual(citationForSkill("STEEP_TURNS"));
  });

  it("never presents general curated guidance as if it were this student's own evidence", async () => {
    const repo = fakeRepo({
      lastDebrief: debrief({ assessmentDifferences: [{ taskLabel: "Steep turns", studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" }] }),
      signals: [trainingSignal({ skill: "STEEP_TURNS", statement: "Entered the turn 200 feet high." })],
    });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
    });
    // The student-specific evidence and Vector's general coaching text must
    // never be the same string -- they come from entirely separate fields
    // (recommended.evidence vs vectorSession.coaching) and must stay
    // distinguishable to a reader.
    const coachingStrings = [
      ...(props.vectorSession?.coaching?.preparationPoints ?? []),
      ...(props.vectorSession?.coaching?.commonErrors ?? []),
    ];
    expect(coachingStrings.length).toBeGreaterThan(0);
    expect(coachingStrings).not.toContain(props.recommended?.evidence.text);
  });

  it("renders the CFI-recommended scenario with real provenance and 'Start practice' copy -- never 'assign'", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({
      signals: [trainingSignal()],
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
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
      radioPracticeHref: "/train/radio-practice",
    });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Danny recommends");
    expect(markup).toContain("Start practice");
    // Strip href values first -- /practice/assignment-1's id legitimately
    // contains "assign" as an implementation detail; the check is about
    // visible text, not the assignment id in a URL nobody reads.
    const visibleText = markup.replace(/href="[^"]*"/g, "");
    expect(visibleText.toLowerCase()).not.toMatch(/assign/);
  });

  it("always shows the generic Radio Practice entry point, reachable with no CFI recommendation at all", async () => {
    const { StudentTrain } = await import("@/components/student/student-train");
    const repo = fakeRepo({ signals: [trainingSignal()], radioAssignments: [] });
    const props = await buildProductionTrainProps(repo, viewer(), {
      chairFlyHref: "/train/chair-fly",
      skillHref: (s) => `/progress/${s}`,
      radioPracticeHref: "/train/radio-practice",
    });
    const markup = renderToStaticMarkup(<StudentTrain {...props} />);
    expect(markup).toContain("Radio Practice");
    expect(markup).toContain('href="/train/radio-practice"');
  });
});
