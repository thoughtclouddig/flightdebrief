import { describe, expect, it } from "vitest";
import { groupDebriefQueue } from "./debrief-queue";
import type { StudentRosterEntry } from "@/lib/training-memory";
import type { Repository } from "@/lib/data/types";
import type { FlightTask, FlightWithRelations, Organization, User } from "@/lib/types";

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
    topRecurringTheme: null,
    ...overrides,
  };
}

/** Same shape as lib/debrief-progress.test.ts's own fakeRepo -- only what computeDebriefProgress reads. */
function fakeRepo(opts: {
  organization?: Organization | null;
  tasks?: FlightTask[];
  debriefExists?: boolean;
}): Repository {
  return {
    getOrganization: async () => opts.organization ?? null,
    listFlightTasks: async () => opts.tasks ?? [],
    getAssessment: async () => null,
    getDebriefByFlight: async () => (opts.debriefExists ? ({} as never) : null),
  } as unknown as Repository;
}

describe("groupDebriefQueue", () => {
  it("groups an instructor-actionable stage under needsAction and a student-owned stage under waiting", async () => {
    const tasksRepo = fakeRepo({ organization: org(), tasks: [] }); // no tasks -> awaiting_tasks, instructor-actionable
    const waitingRepo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "f-waiting", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-01-01T00:00:00.000Z" }],
    }); // tasks exist, no student assessment -> awaiting_student_assessment, not instructor-actionable

    const repo: Repository = {
      ...tasksRepo,
      listFlightTasks: async (flightId: string) => (flightId === "f-waiting" ? await waitingRepo.listFlightTasks(flightId) : []),
    } as unknown as Repository;

    const roster = [
      rosterEntry({
        student: user({ id: "s-tasks", name: "Needs Tasks" }),
        pendingFlight: flight({ id: "f-tasks", userId: "s-tasks" }),
      }),
      rosterEntry({
        student: user({ id: "s-waiting", name: "Waiting Student" }),
        pendingFlight: flight({ id: "f-waiting", userId: "s-waiting" }),
      }),
    ];

    const queue = await groupDebriefQueue(repo, roster, "instructor-1");

    expect(queue.needsAction.map((i) => i.studentId)).toEqual(["s-tasks"]);
    expect(queue.needsAction[0]!.actionHref).toBe("/cfi-v2/flights/f-tasks/debrief");
    expect(queue.waiting.map((i) => i.studentId)).toEqual(["s-waiting"]);
    expect(queue.waiting[0]!.reason).toBe("Waiting on student");
  });

  it("sorts needsAction by urgency -- awaiting_finish before awaiting_tasks", async () => {
    const repo: Repository = {
      getOrganization: async () => org(),
      listFlightTasks: async (flightId: string) => (flightId === "f-tasks" ? [] : [{ id: "t1", flightId, taskCode: "SHORT_FIELD_LANDING", label: "x", source: "instructor_selected", sortOrder: 0, createdAt: "2026-01-01T00:00:00.000Z" }]),
      getAssessment: async () => null,
      getDebriefByFlight: async (flightId: string) => (flightId === "f-finish" ? ({} as never) : null),
    } as unknown as Repository;

    const roster = [
      rosterEntry({
        student: user({ id: "s-tasks", name: "Needs Tasks" }),
        pendingFlight: flight({ id: "f-tasks", userId: "s-tasks" }),
      }),
      rosterEntry({
        student: user({ id: "s-finish", name: "Needs Finish" }),
        pendingFlight: flight({ id: "f-finish", userId: "s-finish" }),
      }),
    ];

    const queue = await groupDebriefQueue(repo, roster, "instructor-1");

    expect(queue.needsAction.map((i) => i.studentId)).toEqual(["s-finish", "s-tasks"]);
    expect(queue.needsAction[0]!.actionLabel).toBe("Review");
  });

  it("surfaces a completed-only student under recentlyCompleted, most recent first, never mixed into needsAction/waiting", async () => {
    const repo = fakeRepo({});
    const roster = [
      rosterEntry({
        student: user({ id: "s-older", name: "Older Completion" }),
        pendingFlight: null,
        mostRecentFlight: flight({ id: "f-older", userId: "s-older", debriefStatus: "complete", flightDate: "2026-08-01" }),
      }),
      rosterEntry({
        student: user({ id: "s-newer", name: "Newer Completion" }),
        pendingFlight: null,
        mostRecentFlight: flight({ id: "f-newer", userId: "s-newer", debriefStatus: "complete", flightDate: "2026-08-15" }),
      }),
    ];

    const queue = await groupDebriefQueue(repo, roster, "instructor-1");

    expect(queue.needsAction).toHaveLength(0);
    expect(queue.waiting).toHaveLength(0);
    expect(queue.recentlyCompleted.map((c) => c.studentId)).toEqual(["s-newer", "s-older"]);
    expect(queue.recentlyCompleted[0]!.resultsHref).toBe("/cfi-v2/flights/f-newer/debrief/results");
  });

  it("caps recentlyCompleted at 8, dropping the rest rather than letting history dominate the page", async () => {
    const repo = fakeRepo({});
    const roster = Array.from({ length: 10 }, (_, i) =>
      rosterEntry({
        student: user({ id: `s-${i}`, name: `Student ${i}` }),
        pendingFlight: null,
        mostRecentFlight: flight({
          id: `f-${i}`,
          userId: `s-${i}`,
          debriefStatus: "complete",
          flightDate: `2026-08-${String(i + 1).padStart(2, "0")}`,
        }),
      }),
    );

    const queue = await groupDebriefQueue(repo, roster, "instructor-1");

    expect(queue.recentlyCompleted).toHaveLength(8);
    expect(queue.recentlyCompleted[0]!.studentId).toBe("s-9"); // most recent (08-10) sorts first
  });
});
