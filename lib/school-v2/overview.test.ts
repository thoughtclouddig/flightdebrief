import { describe, expect, it } from "vitest";
import { schoolAttentionFromRoster } from "./overview";
import type { SchoolV2RosterEntry } from "./roster";
import { recurringThemeSummary, type RecurringTheme, type StudentRosterEntry } from "@/lib/training-memory";
import type { Repository } from "@/lib/data/types";
import type { FlightWithRelations, Organization, User } from "@/lib/types";

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

function schoolRosterEntry(overrides: Partial<StudentRosterEntry> = {}, instructor: { id: string; name: string } = { id: "instructor-1", name: "Morgan CFI" }): SchoolV2RosterEntry {
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
    primaryInstructorId: instructor.id,
    primaryInstructorName: instructor.name,
    ...overrides,
  };
}

function fakeRepo(opts: { organization?: Organization | null } = {}): Repository {
  return {
    getOrganization: async () => opts.organization ?? null,
    listFlightTasks: async () => [],
    getAssessment: async () => null,
    getDebriefByFlight: async () => null,
  } as unknown as Repository;
}

describe("schoolAttentionFromRoster", () => {
  it("flags an in-flight debrief with a neutral, third-party reason -- never 'your assessment'", async () => {
    const repo = fakeRepo({ organization: org({ defaultGuidanceMode: "freeform" }) });
    const roster = [schoolRosterEntry({ pendingFlight: flight() })];

    const result = await schoolAttentionFromRoster(repo, roster);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      studentId: "student-1",
      studentName: "Riley Student",
      instructorName: "Morgan CFI",
      reason: "unresolved_debrief",
      href: "/school-v2/students/student-1",
    });
    expect(result[0]!.detail).not.toMatch(/your/i);
  });

  it("flags a recurring theme by reusing recurringThemeSummary verbatim, not a re-derived string", async () => {
    const repo = fakeRepo();
    const theme = recurringTheme();
    const roster = [schoolRosterEntry({ topRecurringTheme: theme })];

    const result = await schoolAttentionFromRoster(repo, roster);

    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe("recurring_theme");
    expect(result[0]!.detail).toBe(recurringThemeSummary(theme));
  });

  it("flags a genuinely stale gap using the same STALE_DAYS_THRESHOLD as CFI V2's own Today", async () => {
    const repo = fakeRepo();
    const roster = [schoolRosterEntry({ mostRecentFlight: flight({ flightDate: daysAgo(30) }) })];

    const result = await schoolAttentionFromRoster(repo, roster);

    // Real-clock relative, like daysAgo() itself -- Math.floor on a live
    // Date.now() can land on 29 or 30 depending on time-of-day, so this
    // asserts the shape and that the threshold held, not an exact count.
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe("stale_gap");
    expect(result[0]!.detail).toMatch(/^No flight in (29|30) days$/);
  });

  it("does not flag a short gap between lessons", async () => {
    const repo = fakeRepo();
    const roster = [schoolRosterEntry({ mostRecentFlight: flight({ flightDate: daysAgo(3) }) })];

    const result = await schoolAttentionFromRoster(repo, roster);

    expect(result).toHaveLength(0);
  });

  it("flags an upcoming lesson with no objectives yet, with an href anchored at #next-flight", async () => {
    const repo = fakeRepo();
    const roster = [
      schoolRosterEntry({
        mostRecentFlight: flight({ flightDate: daysAgo(3) }),
        nextReservation: {
          id: "res-1",
          organizationId: "org-1",
          studentId: "student-1",
          instructorId: "instructor-1",
          aircraftId: "aircraft-1",
          scheduledStart: new Date(Date.now() + 86400000).toISOString(),
          scheduledEnd: new Date(Date.now() + 90000000).toISOString(),
          status: "scheduled",
          externalProvider: null,
          externalId: null,
        },
        hasNextLessonItems: false,
      }),
    ];

    const result = await schoolAttentionFromRoster(repo, roster);

    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe("no_objectives_yet");
    expect(result[0]!.href).toBe("/school-v2/students/student-1#next-flight");
  });

  it("ranks an in-flight debrief ahead of a no-pending-flight reason", async () => {
    const repo = fakeRepo({ organization: org({ defaultGuidanceMode: "freeform" }) });
    const roster = [
      schoolRosterEntry({
        student: user({ id: "student-stale", name: "Stale Student" }),
        mostRecentFlight: flight({ id: "flight-old", flightDate: daysAgo(30) }),
      }),
      schoolRosterEntry({
        student: user({ id: "student-pending", name: "Pending Student" }),
        pendingFlight: flight({ id: "flight-new" }),
      }),
    ];

    const result = await schoolAttentionFromRoster(repo, roster);

    expect(result.map((r) => r.studentId)).toEqual(["student-pending", "student-stale"]);
  });

  it("never includes a score, rank, or grade field -- monitoring context only", async () => {
    const repo = fakeRepo();
    const roster = [schoolRosterEntry({ topRecurringTheme: recurringTheme() })];

    const result = await schoolAttentionFromRoster(repo, roster);

    const keys = Object.keys(result[0]!);
    expect(keys.some((k) => /score|rank|grade|performance/i.test(k))).toBe(false);
  });

  it("returns nothing for a healthy, uneventful student", async () => {
    const repo = fakeRepo();
    const roster = [schoolRosterEntry({ mostRecentFlight: flight({ flightDate: daysAgo(3) }) })];

    const result = await schoolAttentionFromRoster(repo, roster);

    expect(result).toEqual([]);
  });
});
