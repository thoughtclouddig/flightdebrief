import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";
import type { DebriefAssessment, FlightWithRelations, Instructor } from "@/lib/types";

vi.mock("@/lib/auth/guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/guard")>();
  return { ...actual, authorize: vi.fn() };
});
vi.mock("@/lib/data", () => ({ getRepository: vi.fn() }));

const JAKE: Instructor = { id: "instructor-1", name: "Jake Alvarez" };

function studentViewer(): Viewer {
  return {
    user: { id: "student-1", name: "Real Student", email: "real@example.com", authUserId: "real@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
    organization: {
      id: "org-1",
      name: "Real School",
      kind: "school",
      defaultGuidanceMode: "freeform",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: null,
      subscriptionQuantity: 1,
      demoExpiresAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    role: "student",
  } as unknown as Viewer;
}

function baseFlight(overrides: Partial<FlightWithRelations> = {}): FlightWithRelations {
  return {
    id: "flight-1",
    userId: "student-1",
    organizationId: "org-1",
    aircraftId: "aircraft-1",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: "2026-09-08",
    durationMinutes: 60,
    instructorId: null,
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "in_progress",
    track: null,
    createdAt: "2026-09-08T20:00:00.000Z",
    aircraft: { id: "aircraft-1", tailNumber: "N123AB", type: "Cessna 172", make: "Cessna", model: "172", homeAirport: "KFFZ", organizationId: "org-1", status: "active", externalProvider: null, externalId: null },
    instructor: null,
    ...overrides,
  };
}

function request(): Request {
  return new Request("http://localhost/api/flights/flight-1/debrief/assessments/student/submit", {
    method: "POST",
    body: JSON.stringify({ overallReflection: null }),
  });
}

/** Everything the submit route + its internal generateAndPersistCards actually touch. */
function fakeRepo(flight: FlightWithRelations) {
  const createCards = vi.fn().mockResolvedValue(undefined);
  const submitAssessment = vi.fn().mockResolvedValue(undefined);
  const cardsStore: unknown[] = [];

  const repo = {
    getFlight: vi.fn().mockResolvedValue(flight),
    listFlightTasks: vi.fn().mockResolvedValue([{ id: "task-1", flightId: flight.id, taskCode: "SHORT_FIELD_LANDING", label: "Short field landing", source: "student_selected", sortOrder: 0, createdAt: "2026-09-08T20:00:00.000Z" }]),
    getAssessment: vi.fn(),
    getOrCreateAssessment: vi.fn(async (_flightId: string, role: "student" | "instructor", assessorUserId: string, attribution: "account_verified" | "guest_handoff") => ({
      id: `assessment-${role}`,
      flightId: flight.id,
      role,
      assessorUserId,
      attribution,
      status: "in_progress",
      submittedAt: null,
      overallReflection: null,
      createdAt: "2026-09-08T20:10:00.000Z",
    })),
    submitAssessment,
    listCards: vi.fn().mockResolvedValue(cardsStore),
    listAssessmentRatings: vi.fn().mockResolvedValue([]),
    listCardDefinitions: vi.fn().mockResolvedValue([]),
    listFlights: vi.fn().mockResolvedValue([]),
    listStudentNotes: vi.fn().mockResolvedValue([]),
    setStudentNoteDone: vi.fn().mockResolvedValue(undefined),
    createCards,
  };
  return { repo, createCards, submitAssessment };
}

describe("POST /api/flights/[id]/debrief/assessments/[role]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer: studentViewer() });
  });

  it("solo flight (no instructor): the student's own submission generates cards immediately -- never stuck waiting for an instructor assessment that will never exist", async () => {
    const flight = baseFlight({ instructor: null });
    const { repo, createCards } = fakeRepo(flight);
    vi.mocked(repo.getAssessment).mockImplementation(async (_id: string, role: "student" | "instructor") =>
      role === "instructor" ? null : null,
    );
    vi.mocked(getRepository).mockReturnValue(repo as unknown as ReturnType<typeof getRepository>);

    const res = await POST(request(), { params: Promise.resolve({ id: "flight-1", role: "student" }) });

    expect(res.status).toBe(200);
    expect(createCards).toHaveBeenCalledTimes(1);
    // No instructor ratings should have been fetched for a flight with no instructor.
    expect(repo.listAssessmentRatings).toHaveBeenCalledTimes(1);
  });

  it("instructional flight (has instructor): the student's submission alone does NOT generate cards -- still waits for the instructor's", async () => {
    const flight = baseFlight({ instructor: JAKE, instructorId: JAKE.id });
    const { repo, createCards } = fakeRepo(flight);
    vi.mocked(repo.getAssessment).mockResolvedValue(null); // no instructor assessment yet
    vi.mocked(getRepository).mockReturnValue(repo as unknown as ReturnType<typeof getRepository>);

    const res = await POST(request(), { params: Promise.resolve({ id: "flight-1", role: "student" }) });

    expect(res.status).toBe(200);
    expect(createCards).not.toHaveBeenCalled();
  });

  it("instructional flight: cards generate once the instructor's assessment is submitted after the student's", async () => {
    const flight = baseFlight({ instructor: JAKE, instructorId: JAKE.id });
    const { repo, createCards } = fakeRepo(flight);
    const studentAssessment: DebriefAssessment = {
      id: "assessment-student",
      flightId: flight.id,
      role: "student",
      assessorUserId: "student-1",
      attribution: "account_verified",
      status: "submitted",
      submittedAt: "2026-09-08T20:05:00.000Z",
      overallReflection: null,
      createdAt: "2026-09-08T20:00:00.000Z",
    };
    vi.mocked(repo.getAssessment).mockImplementation(async (_id: string, role: "student" | "instructor") =>
      role === "student" ? studentAssessment : null,
    );
    vi.mocked(getRepository).mockReturnValue(repo as unknown as ReturnType<typeof getRepository>);
    vi.mocked(authorize).mockResolvedValue({
      viewer: { ...studentViewer(), role: "instructor", user: { ...studentViewer().user, id: "instructor-1" } } as unknown as Viewer,
    });

    const res = await POST(request(), { params: Promise.resolve({ id: "flight-1", role: "instructor" }) });

    expect(res.status).toBe(200);
    expect(createCards).toHaveBeenCalledTimes(1);
    // Both student and instructor ratings should have been fetched.
    expect(repo.listAssessmentRatings).toHaveBeenCalledTimes(2);
  });

  it("submitting the student's assessment always persists it (submitAssessment called), regardless of instructor presence -- it is never silently skipped", async () => {
    const flight = baseFlight({ instructor: null });
    const { repo, submitAssessment } = fakeRepo(flight);
    vi.mocked(repo.getAssessment).mockResolvedValue(null);
    vi.mocked(getRepository).mockReturnValue(repo as unknown as ReturnType<typeof getRepository>);

    await POST(request(), { params: Promise.resolve({ id: "flight-1", role: "student" }) });

    expect(submitAssessment).toHaveBeenCalledWith("assessment-student", null);
  });
});
