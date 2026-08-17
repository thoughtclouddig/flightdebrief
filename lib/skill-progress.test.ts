import { describe, expect, it } from "vitest";
import { computeSkillProgression } from "./skill-progress";
import type { TrainingSignal } from "@/lib/types";

function signal(overrides: Partial<TrainingSignal> & { flightId: string; flightDate: string; status: TrainingSignal["status"] }): TrainingSignal {
  return {
    id: `${overrides.flightId}-${overrides.flightDate}`,
    organizationId: "org-1",
    studentId: "student-1",
    instructorId: "instructor-1",
    aircraftId: "aircraft-1",
    debriefId: `debrief-${overrides.flightId}`,
    category: "LANDINGS",
    skill: "SHORT_FIELD_LANDING",
    source: "STUDENT_AND_INSTRUCTOR",
    statement: "test statement",
    dismissed: false,
    createdAt: `${overrides.flightDate}T20:00:00.000Z`,
    ...overrides,
  };
}

describe("computeSkillProgression", () => {
  it("marks a skill's first-ever signal as Introduced", () => {
    const [result] = computeSkillProgression([signal({ flightId: "f1", flightDate: "2026-01-01", status: "IMPROVING" })]);
    expect(result!.status).toBe("Introduced");
  });

  it("marks the latest signal as Needs Coaching regardless of history", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "IMPROVING" }),
      signal({ flightId: "f2", flightDate: "2026-01-08", status: "NEEDS_COACHING" }),
    ]);
    expect(result[0]!.status).toBe("Needs Coaching");
  });

  it("marks a single IMPROVING following a NEEDS_COACHING as Developing", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "NEEDS_COACHING" }),
      signal({ flightId: "f2", flightDate: "2026-01-08", status: "IMPROVING" }),
    ]);
    expect(result[0]!.status).toBe("Developing");
  });

  it("marks a single IMPROVING after Introduced (no NEEDS_COACHING predecessor) as Improving", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "IMPROVING" }),
      signal({ flightId: "f2", flightDate: "2026-01-08", status: "IMPROVING" }),
    ]);
    expect(result[0]!.status).toBe("Improving");
  });

  it("marks 3+ consecutive IMPROVING as Demonstrated", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "NEEDS_COACHING" }),
      signal({ flightId: "f2", flightDate: "2026-01-08", status: "IMPROVING" }),
      signal({ flightId: "f3", flightDate: "2026-01-15", status: "IMPROVING" }),
      signal({ flightId: "f4", flightDate: "2026-01-22", status: "IMPROVING" }),
    ]);
    expect(result[0]!.status).toBe("Demonstrated");
  });

  it("resets the consecutive-improving streak after a NEEDS_COACHING", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "IMPROVING" }),
      signal({ flightId: "f2", flightDate: "2026-01-08", status: "IMPROVING" }),
      signal({ flightId: "f3", flightDate: "2026-01-15", status: "NEEDS_COACHING" }),
      signal({ flightId: "f4", flightDate: "2026-01-22", status: "IMPROVING" }),
    ]);
    expect(result[0]!.status).toBe("Developing");
  });

  it("groups by skill independently and sorts results by label", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "IMPROVING", skill: "STALLS", category: "MANEUVERS" }),
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "NEEDS_COACHING", skill: "SHORT_FIELD_LANDING", category: "LANDINGS" }),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.skill)).toContain("STALLS");
    expect(result.map((r) => r.skill)).toContain("SHORT_FIELD_LANDING");
  });

  it("returns history oldest-first", () => {
    const result = computeSkillProgression([
      signal({ flightId: "f2", flightDate: "2026-01-08", status: "IMPROVING" }),
      signal({ flightId: "f1", flightDate: "2026-01-01", status: "NEEDS_COACHING" }),
    ]);
    expect(result[0]!.history.map((h) => h.flightId)).toEqual(["f1", "f2"]);
  });
});
