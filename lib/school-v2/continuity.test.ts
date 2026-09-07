import { describe, expect, it } from "vitest";
import { computeContinuityForRoster } from "./continuity";
import type { SchoolV2RosterEntry } from "./roster";
import type { RecurringTheme } from "@/lib/training-memory";
import type { Repository } from "@/lib/data/types";
import type { StudentInstructor, User } from "@/lib/types";

function studentEntry(id: string, name: string, overrides: Partial<SchoolV2RosterEntry> = {}): SchoolV2RosterEntry {
  return {
    student: { id, name, email: `${id}@example.com`, authUserId: `${id}@example.com`, avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
    status: "active",
    isPrimary: true,
    mostRecentFlight: null,
    pendingFlight: null,
    lastDebriefStatus: null,
    nextReservation: null,
    currentFocus: [],
    hasNextLessonItems: true,
    topRecurringTheme: null,
    primaryInstructorId: "instructor-current",
    primaryInstructorName: "Devon Brooks",
    ...overrides,
  };
}

function link(overrides: Partial<StudentInstructor>): StudentInstructor {
  return {
    id: "link",
    studentId: "student-1",
    instructorId: "instructor-current",
    organizationId: "org-1",
    isPrimary: true,
    status: "active",
    createdAt: "2026-08-15T00:00:00.000Z",
    ...overrides,
  };
}

function theme(overrides: Partial<RecurringTheme> = {}): RecurringTheme {
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

const PRIOR_INSTRUCTOR: User = {
  id: "instructor-prior",
  name: "Avery Chen",
  email: "avery@example.com",
  authUserId: "avery@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("computeContinuityForRoster", () => {
  it("flags a student with a real prior, non-primary StudentInstructor row under a different instructor", async () => {
    const repo = {
      listInstructorLinksForStudent: async (studentId: string) =>
        studentId === "student-1"
          ? [
              link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" }),
              link({ id: "link-prior", instructorId: "instructor-prior", isPrimary: false, status: "inactive" }),
            ]
          : [],
      getUser: async (id: string) => (id === "instructor-prior" ? PRIOR_INSTRUCTOR : null),
    } as unknown as Repository;

    const result = await computeContinuityForRoster(repo, [studentEntry("student-1", "Ava Kimura")]);

    expect(result).toEqual([
      {
        studentId: "student-1",
        studentName: "Ava Kimura",
        priorInstructorName: "Avery Chen",
        currentInstructorName: "Devon Brooks",
        since: "2026-08-15T00:00:00.000Z",
        themeSummary: null,
      },
    ]);
  });

  it("surfaces the student's own recurring theme as themeSummary -- did the issue carry across the handoff", async () => {
    const repo = {
      listInstructorLinksForStudent: async () => [
        link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" }),
        link({ id: "link-prior", instructorId: "instructor-prior", isPrimary: false, status: "inactive" }),
      ],
      getUser: async (id: string) => (id === "instructor-prior" ? PRIOR_INSTRUCTOR : null),
    } as unknown as Repository;

    const result = await computeContinuityForRoster(repo, [studentEntry("student-1", "Ava Kimura", { topRecurringTheme: theme() })]);

    expect(result[0]!.themeSummary).toBe("Crosswind landings has come up in 3 lessons with 2 instructors.");
  });

  it("does not flag a student who has only ever had one instructor", async () => {
    const repo = {
      listInstructorLinksForStudent: async () => [link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" })],
      getUser: async () => null,
    } as unknown as Repository;

    const result = await computeContinuityForRoster(repo, [studentEntry("student-1", "Casey Learner")]);

    expect(result).toEqual([]);
  });

  it("works identically whether given one instructor's students or the whole org roster", async () => {
    const repo = {
      listInstructorLinksForStudent: async (studentId: string) =>
        studentId === "student-1"
          ? [
              link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" }),
              link({ id: "link-prior", instructorId: "instructor-prior", isPrimary: false, status: "inactive" }),
            ]
          : [],
      getUser: async (id: string) => (id === "instructor-prior" ? PRIOR_INSTRUCTOR : null),
    } as unknown as Repository;

    const orgWide = await computeContinuityForRoster(repo, [
      studentEntry("student-1", "Ava Kimura"),
      studentEntry("student-2", "Zoe Student", { primaryInstructorId: "instructor-other", primaryInstructorName: "Nora Fitzgerald" }),
    ]);

    expect(orgWide).toHaveLength(1);
    expect(orgWide[0]!.studentId).toBe("student-1");
  });

  it("never invents a score, tenure metric, or comparison between instructors", async () => {
    const repo = {
      listInstructorLinksForStudent: async () => [
        link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" }),
        link({ id: "link-prior", instructorId: "instructor-prior", isPrimary: false, status: "inactive" }),
      ],
      getUser: async (id: string) => (id === "instructor-prior" ? PRIOR_INSTRUCTOR : null),
    } as unknown as Repository;

    const result = await computeContinuityForRoster(repo, [studentEntry("student-1", "Ava Kimura")]);

    const keys = Object.keys(result[0]!);
    expect(keys.some((k) => /score|rank|grade|performance|tenure/i.test(k))).toBe(false);
  });
});
