import { describe, expect, it } from "vitest";
import { needsYouNowFromRoster } from "./today";
import type { StudentRosterEntry } from "@/lib/training-memory";
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
    // the link right by construction, keyed off the stage enum instead.
    const repo = fakeRepo({ organization: org(), tasks: [] });
    const roster = [rosterEntry({ pendingFlight: flight() })];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      studentId: "student-1",
      reason: "Objectives not confirmed yet",
      actionLabel: "Confirm objectives",
      actionHref: "/flights/flight-1/debrief/tasks",
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
    expect(result[0]!.actionLabel).toBe("Finish review");
    expect(result[1]!.reason).toBe("Waiting on student");
  });

  it("names the other instructor only when a flight was flown with someone else", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [] });
    const roster = [rosterEntry({ pendingFlight: flight({ instructor: { id: "other-cfi", name: "Jamie Ortiz" } }) })];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result[0]!.otherInstructorName).toBe("Jamie Ortiz");
  });

  it("combines multiple attention reasons for a student with no pending flight into one item, linking to their profile", async () => {
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        pendingFlight: null,
        mostRecentFlight: flight({ debriefStatus: "complete" }),
        hasNextLessonItems: false,
        nextReservation: null,
      }),
    ];

    const result = await needsYouNowFromRoster(repo, roster, "instructor-1");

    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe("Next lesson has no objectives · No flight scheduled");
    expect(result[0]!.actionHref).toBe("/cfi-v2/students/student-1");
  });

  it("omits a student with nothing to flag", async () => {
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        pendingFlight: null,
        mostRecentFlight: flight({ debriefStatus: "complete" }),
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
