import { describe, expect, it } from "vitest";
import { computeSchoolV2Instructors } from "./instructors";
import type { Repository } from "@/lib/data/types";
import type { FlightWithRelations, OrganizationMember, StudentInstructor, User } from "@/lib/types";

const USERS: Record<string, User> = {
  "instructor-a": { id: "instructor-a", name: "Avery Chen", email: "avery@example.com", authUserId: "avery@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  "instructor-b": { id: "instructor-b", name: "Devon Brooks", email: "devon@example.com", authUserId: "devon@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  "student-1": { id: "student-1", name: "Zoe Student", email: "zoe@example.com", authUserId: "zoe@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  "student-2": { id: "student-2", name: "Marcus Webb", email: "marcus@example.com", authUserId: "marcus@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
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

function pendingFlight(studentId: string): FlightWithRelations {
  return {
    id: `flight-${studentId}`,
    userId: studentId,
    organizationId: "org-1",
    aircraftId: "aircraft-1",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: "2026-08-20",
    durationMinutes: 60,
    instructorId: "instructor-a",
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "in_progress",
    track: null,
    createdAt: "2026-08-20T20:00:00.000Z",
    aircraft: { id: "aircraft-1", tailNumber: "N123AB", type: "Cessna 172", make: "Cessna", model: "172", homeAirport: "KFFZ", organizationId: "org-1", status: "active", externalProvider: null, externalId: null },
    instructor: { id: "instructor-a", name: "Avery Chen" },
  };
}

/** instructor-a has 2 students; only student-1 has a pending (undebriefed) flight. instructor-b has 0 students. */
function fakeRepo(): Repository {
  const linksByInstructor: Record<string, StudentInstructor[]> = {
    "instructor-a": [
      link({ id: "link-1", studentId: "student-1", instructorId: "instructor-a", isPrimary: true, status: "active" }),
      link({ id: "link-2", studentId: "student-2", instructorId: "instructor-a", isPrimary: true, status: "active" }),
    ],
    "instructor-b": [],
  };

  return {
    listMembers: async () => [member({ id: "m-a", userId: "instructor-a" }), member({ id: "m-b", userId: "instructor-b" })],
    getUser: async (id: string) => USERS[id] ?? null,
    listStudentLinksForInstructor: async (instructorId: string) => linksByInstructor[instructorId] ?? [],
    listFlights: async ({ studentId }: { studentId?: string } = {}) => (studentId === "student-1" ? [pendingFlight(studentId)] : []),
    listReservations: async () => [],
    listTrainingItems: async () => [],
    listTrainingSignals: async () => [],
    // Any truthy debrief short-circuits computeDebriefProgress to "awaiting_finish" without needing org/tasks fixtures.
    getDebriefByFlight: async (flightId: string) => (flightId === "flight-student-1" ? ({} as never) : null),
  } as unknown as Repository;
}

describe("computeSchoolV2Instructors", () => {
  it("counts a needs-attention student using the SAME schoolAttentionFromRoster logic Overview/Students use", async () => {
    const instructors = await computeSchoolV2Instructors(fakeRepo(), "org-1");

    const avery = instructors.find((i) => i.instructor.id === "instructor-a")!;
    expect(avery.activeStudentCount).toBe(2);
    expect(avery.attentionCount).toBe(1); // only student-1 has a pending debrief
  });

  it("reports zero attention for an instructor with no flagged students, not undefined or an error", async () => {
    const instructors = await computeSchoolV2Instructors(fakeRepo(), "org-1");

    const devon = instructors.find((i) => i.instructor.id === "instructor-b")!;
    expect(devon.activeStudentCount).toBe(0);
    expect(devon.attentionCount).toBe(0);
  });

  it("never introduces a score, rank, or grade field on the instructor summary", async () => {
    const instructors = await computeSchoolV2Instructors(fakeRepo(), "org-1");

    const keys = Object.keys(instructors[0]!);
    expect(keys.some((k) => /score|rank|grade|performance/i.test(k))).toBe(false);
  });
});
