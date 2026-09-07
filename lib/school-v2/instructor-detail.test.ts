import { describe, expect, it } from "vitest";
import { computeContinuity } from "./instructor-detail";
import type { SchoolV2RosterEntry } from "./roster";
import type { Repository } from "@/lib/data/types";
import type { StudentInstructor, User } from "@/lib/types";

function studentEntry(id: string, name: string): SchoolV2RosterEntry {
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
    primaryInstructorName: "Current Instructor",
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

const PRIOR_INSTRUCTOR: User = {
  id: "instructor-prior",
  name: "Prior Instructor",
  email: "prior@example.com",
  authUserId: "prior@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("computeContinuity", () => {
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

    const result = await computeContinuity(repo, [studentEntry("student-1", "Casey Learner")], "instructor-current");

    expect(result).toEqual([
      { studentId: "student-1", studentName: "Casey Learner", priorInstructorName: "Prior Instructor", since: "2026-08-15T00:00:00.000Z" },
    ]);
  });

  it("does not flag a student who has only ever had one instructor", async () => {
    const repo = {
      listInstructorLinksForStudent: async () => [link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" })],
      getUser: async () => null,
    } as unknown as Repository;

    const result = await computeContinuity(repo, [studentEntry("student-1", "Casey Learner")], "instructor-current");

    expect(result).toEqual([]);
  });

  it("never invents a score, tenure metric, or comparison between instructors", async () => {
    const repo = {
      listInstructorLinksForStudent: async () => [
        link({ id: "link-current", instructorId: "instructor-current", isPrimary: true, status: "active" }),
        link({ id: "link-prior", instructorId: "instructor-prior", isPrimary: false, status: "inactive" }),
      ],
      getUser: async (id: string) => (id === "instructor-prior" ? PRIOR_INSTRUCTOR : null),
    } as unknown as Repository;

    const result = await computeContinuity(repo, [studentEntry("student-1", "Casey Learner")], "instructor-current");

    const keys = Object.keys(result[0]!);
    expect(keys.some((k) => /score|rank|grade|performance|tenure/i.test(k))).toBe(false);
  });
});
