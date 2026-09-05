import { describe, expect, it } from "vitest";
import { assertCanSetFlightTasks } from "./assessment-access";
import type { Viewer } from "@/lib/viewer";
import type { FlightWithRelations } from "@/lib/types";

function viewer(overrides: Partial<Viewer> = {}): Viewer {
  return {
    user: {
      id: "student-1",
      name: "Mia Chen",
      email: "mia@example.com",
      authUserId: "auth-mia",
      profileCompleted: true,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    organization: {
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
    },
    role: "student",
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
    instructor: null,
    ...overrides,
  };
}

describe("assertCanSetFlightTasks", () => {
  it("lets the owning student initialize an empty task set, with student_confirmed provenance", () => {
    const result = assertCanSetFlightTasks(viewer({ role: "student" }), flight(), 0, false);
    expect(result.ok).toBe(true);
    expect(result.source).toBe("student_confirmed");
  });

  it("refuses the owning student when tasks already exist -- never overwrites", () => {
    const result = assertCanSetFlightTasks(viewer({ role: "student" }), flight(), 3, false);
    expect(result.ok).toBeUndefined();
    expect(result.response?.status).toBe(409);
  });

  it("refuses a student who does not own the flight, even with zero tasks", () => {
    const result = assertCanSetFlightTasks(
      viewer({ role: "student", user: { ...viewer().user, id: "some-other-student" } }),
      flight(),
      0,
      false,
    );
    expect(result.ok).toBeUndefined();
    expect(result.response?.status).toBe(403);
  });

  it("lets an instructor initialize an empty task set, with instructor_selected provenance", () => {
    const result = assertCanSetFlightTasks(viewer({ role: "instructor" }), flight(), 0, false);
    expect(result.ok).toBe(true);
    expect(result.source).toBe("instructor_selected");
  });

  it("still lets an instructor revise an existing task list before the lock -- the picker remains valid, just not mandatory", () => {
    const result = assertCanSetFlightTasks(viewer({ role: "instructor" }), flight(), 3, false);
    expect(result.ok).toBe(true);
    expect(result.source).toBe("instructor_selected");
  });

  it("locks out the owning student once their own assessment is submitted", () => {
    const result = assertCanSetFlightTasks(viewer({ role: "student" }), flight(), 0, true);
    expect(result.ok).toBeUndefined();
    expect(result.response?.status).toBe(409);
  });

  it("locks out the instructor too once the student's assessment is submitted -- the scope is frozen for everyone, not just the student", () => {
    const result = assertCanSetFlightTasks(viewer({ role: "instructor" }), flight(), 3, true);
    expect(result.ok).toBeUndefined();
    expect(result.response?.status).toBe(409);
  });
});
