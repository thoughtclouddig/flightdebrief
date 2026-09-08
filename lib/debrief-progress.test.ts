import { describe, expect, it } from "vitest";
import { computeDebriefProgress } from "./debrief-progress";
import type { Repository } from "@/lib/data/types";
import type {
  DebriefAssessment,
  FlightTask,
  FlightWithRelations,
  Instructor,
  Organization,
} from "@/lib/types";

const JAKE: Instructor = { id: "instructor-1", name: "Jake Alvarez" };

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
    instructorId: null,
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
    // No instructor by default -- tests that mean to represent an
    // instructional flight pass instructor: JAKE explicitly, so the
    // distinction is never accidental.
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

const TASK: FlightTask = {
  id: "t1",
  flightId: "flight-1",
  taskCode: "SHORT_FIELD_LANDING",
  label: "Short field landing",
  source: "instructor_selected",
  sortOrder: 0,
  createdAt: "2026-08-20T20:00:00.000Z",
};

function fakeRepo(opts: {
  organization?: Organization | null;
  tasks?: FlightTask[];
  instructorAssessment?: DebriefAssessment | null;
  studentAssessment?: DebriefAssessment | null;
  debriefExists?: boolean;
}): Repository {
  return {
    // computeDebriefProgress no longer reads the org at all -- kept on the
    // fake purely so it doesn't need reshaping if some future case needs it,
    // never asserted on directly.
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

  it("guidanceMode no longer decides the lifecycle: a freeform-org instructional flight with no tasks yet is awaiting_tasks, not ready_to_debrief", async () => {
    const repo = fakeRepo({ organization: org({ defaultGuidanceMode: "freeform" }), tasks: [] });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_tasks", waitingOn: "instructor" });
  });

  it("guidanceMode no longer decides the lifecycle: a freeform-org SOLO flight with no tasks yet is also awaiting_tasks, not ready_to_debrief", async () => {
    const repo = fakeRepo({ organization: org({ defaultGuidanceMode: "freeform" }), tasks: [] });
    const result = await computeDebriefProgress(repo, flight({ instructor: null }));
    expect(result).toEqual({ stage: "awaiting_tasks", waitingOn: "instructor" });
  });

  it("is awaiting_tasks when an instructional flight has no tasks picked yet", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [] });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_tasks", waitingOn: "instructor" });
  });

  it("is awaiting_student_assessment when tasks exist but the student hasn't submitted -- student always goes first", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [TASK], studentAssessment: null });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_student_assessment", waitingOn: "student" });
  });

  it("is awaiting_instructor_assessment only after the student's assessment is submitted, for an instructional flight", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [TASK],
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
      instructorAssessment: null,
    });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_instructor_assessment", waitingOn: "instructor" });
  });

  it("is ready_to_debrief once both assessments are submitted, carrying the instructor's attribution", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [TASK],
      instructorAssessment: assessment({ role: "instructor", status: "submitted" }),
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
    });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "ready_to_debrief", waitingOn: "instructor", instructorAttribution: "account_verified" });
  });

  it("carries guest_handoff attribution too -- Home uses this to tell a guest-handoff student they can still continue themselves", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [TASK],
      instructorAssessment: assessment({ role: "instructor", status: "submitted", attribution: "guest_handoff" }),
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
    });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "ready_to_debrief", waitingOn: "instructor", instructorAttribution: "guest_handoff" });
  });

  it("is awaiting_finish once a Debrief row exists, even if assessments would otherwise look incomplete", async () => {
    const repo = fakeRepo({ organization: org(), tasks: [], debriefExists: true });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_finish", waitingOn: "instructor" });
  });

  it("does not let an instructor assessment still in_progress count as submitted", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [TASK],
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
      instructorAssessment: assessment({ role: "instructor", status: "in_progress", submittedAt: null }),
    });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_instructor_assessment", waitingOn: "instructor" });
  });

  it("does not let a student assessment still in_progress count as submitted", async () => {
    const repo = fakeRepo({
      organization: org(),
      tasks: [TASK],
      studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "in_progress", submittedAt: null }),
    });
    const result = await computeDebriefProgress(repo, flight({ instructor: JAKE }));
    expect(result).toEqual({ stage: "awaiting_student_assessment", waitingOn: "student" });
  });

  describe("solo (no instructor on the flight)", () => {
    it("still requires the student's own assessment first, exactly like an instructional flight", async () => {
      const repo = fakeRepo({ organization: org(), tasks: [TASK], studentAssessment: null });
      const result = await computeDebriefProgress(repo, flight({ instructor: null }));
      expect(result).toEqual({ stage: "awaiting_student_assessment", waitingOn: "student" });
    });

    it("reaches ready_to_debrief the moment the student's own assessment is submitted -- no instructor assessment, no waiting, no attribution", async () => {
      const repo = fakeRepo({
        organization: org(),
        tasks: [TASK],
        studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
        instructorAssessment: null,
      });
      const result = await computeDebriefProgress(repo, flight({ instructor: null }));
      expect(result).toEqual({ stage: "ready_to_debrief", waitingOn: null });
      expect(result.instructorAttribution).toBeUndefined();
    });

    it("never gets stuck on awaiting_instructor_assessment, even if a stray instructor-role row somehow exists", async () => {
      // Pathological case, shouldn't occur in real data -- proves the solo
      // path is driven by flight.instructor, not by absence/presence of an
      // instructor assessment row.
      const repo = fakeRepo({
        organization: org(),
        tasks: [TASK],
        studentAssessment: assessment({ id: "assessment-2", role: "student", assessorUserId: "student-1", status: "submitted" }),
        instructorAssessment: assessment({ role: "instructor", status: "in_progress", submittedAt: null }),
      });
      const result = await computeDebriefProgress(repo, flight({ instructor: null }));
      expect(result.stage).toBe("ready_to_debrief");
    });
  });
});
