import { describe, expect, it } from "vitest";
import { needsYouNowFromRoster } from "./today";
import { recurringThemeSummary, type RecurringTheme, type StudentRosterEntry } from "@/lib/training-memory";
import type { Repository } from "@/lib/data/types";
import type { DebriefAssessment, FlightTask, FlightWithRelations, Organization, User } from "@/lib/types";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "student-1",
    name: "Riley Student",
    email: "riley@example.com",
    authUserId: "riley@example.com",
    avatarUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function flight(overrides: Partial<FlightWithRelations> = {}): FlightWithRelations {
  return {
    id: "flight-1",
    userId: "student-1",
    organizationId: "org-1",
    aircraftId: "aircraft-1",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: "2026-08-20",
    durationMinutes: 60,
    instructorId: "instructor-1",
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "in_progress",
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
    instructor: { id: "instructor-1", name: "Morgan CFI" },
    ...overrides,
  };
}

function org(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "org-1",
    name: "Skyline Flight Academy",
    kind: "school",
    defaultGuidanceMode: "guided",
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

function recurringTheme(overrides: Partial<RecurringTheme> = {}): RecurringTheme {
  return {
    theme: "Crosswind landings",
    skill: "CROSSWIND_LANDING",
    count: 3,
    consideredFlights: 8,
    instructorCount: 2,
    lessons: [],
    ...overrides,
  };
}

/** Real-clock relative date so staleness assertions never depend on when the suite happens to run. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function rosterEntry(overrides: Partial<StudentRosterEntry> = {}): StudentRosterEntry {
  return {
    student: user(),
    status: "active",
    isPrimary: true,
    mostRecentFlight: null,
    pendingFlight: null,
    lastDebriefStatus: null,
    nextReservation: null,
    currentFocus: [],
    hasNextLessonItems: true,
    topRecurringTheme: null,
    ...overrides,
  };
}

function fakeRepo(opts: {
  organization?: Organization | null;
  tasks?: FlightTask[];
  instructorAssessment?: DebriefAssessment | null;
  studentAssessment?: DebriefAssessment | null;
  debriefExists?: boolean;
}): Repository {
  return {
    getOrganization: async () => opts.organization ?? null,
    listFlightTasks: async () => opts.tasks ?? [],
    getAssessment: async (_flightId: string, role: "student" | "instructor") =>
      role === "instructor" ? (opts.instructorAssessment ?? null) : (opts.studentAssessment ?? null),
    getDebriefByFlight: async () => (opts.debriefExists ? ({} as never) : null),
  } as unknown as Repository;
}

describe("needsYouNowFromRoster", () => {
  it("dispatches on the DebriefProgress stage, not a display-label string -- the awaiting_tasks case V1's Today page silently dropped", async () => {
    // V1's app/(product)/cfi/today/page.tsx only links a "Debrief not started"
    // badge to /debrief/tasks -- a string debriefStageLabel() has never
    // produced since the awaiting_tasks label became "Objectives not
    // confirmed yet", so that branch is dead. This asserts the V2 path gets
    // the link right by construction, keyed off the stage enum instead --
    // and by routing through the single debrief resolver rather than a
    // hand-computed sub-route, so this list can never drift from what the
    // resolver itself would actually do next.
    const repo = fakeRepo({ organization: org(), tasks: [] });
    const roster = [rosterEntry({ pendingFlight: flight() })];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      studentId: "student-1",
      reason: "Objectives not confirmed yet",
      actionLabel: "Confirm objectives",
      actionHref: "/cfi-v2/flights/flight-1/debrief",
    });
  });

  it("sorts an instructor's own pending action (awaiting_finish) ahead of one merely waiting on the student", async () => {
    const waitingOnStudentRepo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "flight-2", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-08-20T20:00:00.000Z" }],
      studentAssessment: null,
    });
    const awaitingFinishRepo = fakeRepo({ organization: org(), tasks: [], debriefExists: true });

    // Two different flights need two different repo behaviors, so drive
    // getOrganization off which flight is being asked about instead of
    // juggling two repos through one call.
    const repo: Repository = {
      ...awaitingFinishRepo,
      getDebriefByFlight: async (flightId: string) => (flightId === "flight-2" ? null : ({} as never)),
      listFlightTasks: async (flightId: string) => (flightId === "flight-2" ? await waitingOnStudentRepo.listFlightTasks(flightId) : []),
      getAssessment: async (flightId: string, role: "student" | "instructor") =>
        flightId === "flight-2" ? waitingOnStudentRepo.getAssessment(flightId, role) : null,
    } as unknown as Repository;

    const roster = [
      rosterEntry({
        student: user({ id: "student-waiting", name: "Waiting Student" }),
        pendingFlight: flight({ id: "flight-2", debriefStatus: "in_progress" }),
      }),
      rosterEntry({
        student: user({ id: "student-ready", name: "Ready Student" }),
        pendingFlight: flight({ id: "flight-1", debriefStatus: "in_progress" }),
      }),
    ];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result.map((r) => r.studentId)).toEqual(["student-ready", "student-waiting"]);
    expect(result[0]!.actionLabel).toBe("Review");
    expect(result[1]!.reason).toBe("Waiting on student");
  });

  it("names the other instructor only when a flight was flown with someone else", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [] });
    const roster = [rosterEntry({ pendingFlight: flight({ instructor: { id: "other-cfi", name: "Jamie Ortiz" } }) })];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result[0]!.otherInstructorName).toBe("Jamie Ortiz");
  });

  it("flags a recurring theme even with no pending flight -- a real cross-lesson pattern, not merely a gap in the calendar", async () => {
    const repo = fakeRepo({});
    const theme = recurringTheme();
    const roster = [rosterEntry({ pendingFlight: null, topRecurringTheme: theme })];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe(recurringThemeSummary(theme));
    expect(result[0]!.actionHref).toBe("/cfi-v2/students/student-1");
  });

  it("flags a genuinely stale gap since the last flight", async () => {
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        pendingFlight: null,
        mostRecentFlight: flight({ flightDate: daysAgo(30) }),
        topRecurringTheme: null,
      }),
    ];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe("No flight in 30 days");
  });

  it("flags an upcoming lesson that still has no objectives set", async () => {
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        pendingFlight: null,
        mostRecentFlight: flight({ flightDate: daysAgo(3) }),
        hasNextLessonItems: false,
        nextReservation: {
          id: "r1",
          organizationId: "org-1",
          studentId: "student-1",
          instructorId: "instructor-1",
          aircraftId: "aircraft-1",
          scheduledStart: "2026-09-10T15:00:00.000Z",
          scheduledEnd: "2026-09-10T16:00:00.000Z",
          status: "scheduled",
          externalProvider: null,
          externalId: null,
        },
      }),
    ];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe("Upcoming lesson has no objectives yet");
    expect(result[0]!.actionHref).toBe("/cfi-v2/students/student-1#next-flight");
  });

  it("does NOT flag a student merely because no flight is scheduled -- that alone isn't urgent", async () => {
    // This is the specific over-inclusion the CFI-V2-2 audit found: V1's
    // attentionReasons() fires on "No flight scheduled" alone, which most of
    // a healthy roster hits on any given day. Nothing else is wrong here --
    // recent flight, no recurring theme, objectives already set -- so this
    // student should be entirely absent from the list.
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        pendingFlight: null,
        mostRecentFlight: flight({ flightDate: daysAgo(3) }),
        hasNextLessonItems: true,
        nextReservation: null,
        topRecurringTheme: null,
      }),
    ];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(0);
  });

  it("omits a student with nothing to flag", async () => {
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        pendingFlight: null,
        mostRecentFlight: flight({ flightDate: daysAgo(3) }),
        hasNextLessonItems: true,
        nextReservation: {
          id: "r1",
          organizationId: "org-1",
          studentId: "student-1",
          instructorId: "instructor-1",
          aircraftId: "aircraft-1",
          scheduledStart: "2026-09-10T15:00:00.000Z",
          scheduledEnd: "2026-09-10T16:00:00.000Z",
          status: "scheduled",
          externalProvider: null,
          externalId: null,
        },
      }),
    ];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(0);
  });
});
