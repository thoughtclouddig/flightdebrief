import { describe, expect, it } from "vitest";
import { computeDebriefProgress } from "./debrief-progress";
import type { Repository } from "@/lib/data/types";
import type {
  DebriefAssessment,
  FlightTask,
  FlightWithRelations,
  Organization,
} from "@/lib/types";

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
    instructor: null,
    ...overrides,
  };
}

function org(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "org-1",
    name: "Falcon Aviation",
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

function assessment(overrides: Partial<DebriefAssessment> = {}): DebriefAssessment {
  return {
    id: "assessment-1",
    flightId: "flight-1",
    role: "instructor",
    assessorUserId: "instructor-1",
    attribution: "account_verified",
    status: "submitted",
    submittedAt: "2026-08-20T21:00:00.000Z",
    overallReflection: null,
    createdAt: "2026-08-20T20:00:00.000Z",
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

describe("computeDebriefProgress", () => {
  it("returns complete once the flight's debrief is done, without checking anything else", async () => {
    const repo = fakeRepo({});
    const result = await computeDebriefProgress(repo, flight({ debriefStatus: "complete" }));
    expect(result).toEqual({ stage: "complete", waitingOn: null });
  });

  it("skips straight to ready_to_debrief for freeform-guidance orgs", async () => {
    const repo = fakeRepo({ organization: org({ defaultGuidanceMode: "freeform" }) });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "ready_to_debrief", waitingOn: "instructor" });
  });

  it("is awaiting_tasks when a guided-mode flight has no tasks picked yet", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [] });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "awaiting_tasks", waitingOn: "instructor" });
  });

  it("is awaiting_student_assessment when tasks exist but the student hasn't submitted -- student always goes first", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "flight-1", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-08-20T20:00:00.000Z" }],
      studentAssessment: null,
    });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "awaiting_student_assessment", waitingOn: "student" });
  });

  it("is awaiting_instructor_assessment only after the student's assessment is submitted", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "flight-1", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-08-20T20:00:00.000Z" }],
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
      instructorAssessment: null,
    });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "awaiting_instructor_assessment", waitingOn: "instructor" });
  });

  it("is ready_to_debrief once both assessments are submitted", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "flight-1", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-08-20T20:00:00.000Z" }],
      instructorAssessment: assessment({ role: "instructor", status: "submitted" }),
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
    });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "ready_to_debrief", waitingOn: "instructor" });
  });

  it("is awaiting_finish once a Debrief row exists, even if assessments would otherwise look incomplete", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [], debriefExists: true });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "awaiting_finish", waitingOn: "instructor" });
  });

  it("does not let an instructor assessment still in_progress count as submitted", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "flight-1", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-08-20T20:00:00.000Z" }],
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
      instructorAssessment: assessment({ role: "instructor", status: "in_progress", submittedAt: null }),
    });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "awaiting_instructor_assessment", waitingOn: "instructor" });
  });

  it("does not let a student assessment still in_progress count as submitted", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [{ id: "t1", flightId: "flight-1", taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "instructor_selected", sortOrder: 0, createdAt: "2026-08-20T20:00:00.000Z" }],
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "in_progress", submittedAt: null }),
    });
    const result = await computeDebriefProgress(repo, flight());
    expect(result).toEqual({ stage: "awaiting_student_assessment", waitingOn: "student" });
  });
});
