import { describe, expect, it } from "vitest";
import { computeSchoolV2Roster } from "./roster";
import type { Repository } from "@/lib/data/types";
import type { OrganizationMember, StudentInstructor, User } from "@/lib/types";

const USERS: Record<string, User> = {
  "instructor-a": { id: "instructor-a", name: "Avery Chen", email: "avery@example.com", authUserId: "avery@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  "instructor-b": { id: "instructor-b", name: "Devon Brooks", email: "devon@example.com", authUserId: "devon@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  "student-1": { id: "student-1", name: "Zoe Student", email: "zoe@example.com", authUserId: "zoe@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  "student-2": { id: "student-2", name: "Ava Kimura", email: "ava@example.com", authUserId: "ava@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
};

function link(overrides: Partial<StudentInstructor>): StudentInstructor {
  return {
    id: "link",
    studentId: "student-1",
    instructorId: "instructor-a",
    organizationId: "org-1",
    isPrimary: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function member(overrides: Partial<OrganizationMember>): OrganizationMember {
  return {
    id: "member",
    organizationId: "org-1",
    userId: "instructor-a",
    role: "instructor",
    status: "active",
    certificateType: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * A student handed off from instructor-a to instructor-b: two
 * StudentInstructor rows for the same student -- the inactive, non-primary
 * one under their PRIOR instructor, and the active, primary one under their
 * CURRENT instructor. This is exactly the shape the demo seed's handoff
 * pairs create.
 */
function fakeRepo(): Repository {
  const linksByInstructor: Record<string, StudentInstructor[]> = {
    "instructor-a": [
      link({ id: "link-1", studentId: "student-1", instructorId: "instructor-a", isPrimary: true, status: "active" }),
      link({ id: "link-2", studentId: "student-2", instructorId: "instructor-a", isPrimary: false, status: "inactive" }),
    ],
    "instructor-b": [link({ id: "link-3", studentId: "student-2", instructorId: "instructor-b", isPrimary: true, status: "active" })],
  };

  return {
    listMembers: async () => [member({ id: "m-a", userId: "instructor-a" }), member({ id: "m-b", userId: "instructor-b" })],
    getUser: async (id: string) => USERS[id] ?? null,
    listStudentLinksForInstructor: async (instructorId: string) => linksByInstructor[instructorId] ?? [],
    listFlights: async () => [],
    listReservations: async () => [],
    listTrainingItems: async () => [],
    listTrainingSignals: async () => [],
    getDebriefByFlight: async () => null,
  } as unknown as Repository;
}

describe("computeSchoolV2Roster", () => {
  it("attaches each student to their CURRENT primary instructor, not a stale prior one", async () => {
    const roster = await computeSchoolV2Roster(fakeRepo(), "org-1");

    const byId = new Map(roster.map((e) => [e.student.id, e]));
    expect(byId.get("student-1")).toMatchObject({ primaryInstructorId: "instructor-a", primaryInstructorName: "Avery Chen" });
    expect(byId.get("student-2")).toMatchObject({ primaryInstructorId: "instructor-b", primaryInstructorName: "Devon Brooks" });
  });

  it("counts a handed-off student exactly once, not once per instructor they've ever had", async () => {
    const roster = await computeSchoolV2Roster(fakeRepo(), "org-1");

    expect(roster.filter((e) => e.student.id === "student-2")).toHaveLength(1);
    expect(roster).toHaveLength(2);
  });

  it("sorts by student name", async () => {
    const roster = await computeSchoolV2Roster(fakeRepo(), "org-1");
    expect(roster.map((e) => e.student.name)).toEqual(["Ava Kimura", "Zoe Student"]);
  });
});
