import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CfiV2StudentDetailScreen } from "./student-detail-screen";
import type { CfiV2StudentDetail } from "@/lib/cfi-v2/student-detail";
import type { NextLessonBrief } from "@/lib/training-memory";
import type { User } from "@/lib/types";

function buildDetail(overrides: Partial<CfiV2StudentDetail> = {}): CfiV2StudentDetail {
  const student: User = {
    id: "student-1",
    name: "Riley Student",
    email: "riley@example.com",
    authUserId: null,
    avatarUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const brief: NextLessonBrief = {
    studentId: student.id,
    lastFlight: null,
    lastDebrief: null,
    lastInstructor: null,
    lastInstructorNote: null,
    lastWentWell: [],
    focusAreas: [],
    keepWorkingOn: [],
    beforeFlightItems: [],
    keepWorkingOnTrainingItems: [],
    beforeFlightTrainingItems: [],
    recurringThemes: [],
    upcomingReservation: null,
    upcomingReservationInstructor: null,
    suggestedQuestion: null,
  };

  return {
    student,
    certificateType: null,
    brief,
    cfiFirstName: "Morgan",
    flyingWithDifferentInstructor: false,
    startingPoint: null,
    lastDebriefResult: null,
    perceptionGaps: [],
    skillProgressions: [],
    timeline: [],
    canSchedule: false,
    instructors: [],
    defaultInstructorId: undefined,
    aircraft: [],
    scheduleCaption: undefined,
    radioPracticeAssignments: [],
    suggestedRadioScenarioId: null,
    studentNotes: [],
    ...overrides,
  };
}

describe("CfiV2StudentDetailScreen -- 'Log a flight' destination", () => {
  it("points at the CFI V2 Add Flight route, keyed to this student, never legacy /flights/new", () => {
    const markup = renderToStaticMarkup(<CfiV2StudentDetailScreen detail={buildDetail()} />);

    expect(markup).toContain('href="/cfi-v2/students/student-1/flights/new"');
    expect(markup).not.toContain("/flights/new?studentId=");
    expect(markup).not.toMatch(/href="\/flights\/new/);
  });

  it("keys the link to whichever student is being viewed, not a fixed id", () => {
    const markup = renderToStaticMarkup(
      <CfiV2StudentDetailScreen detail={buildDetail({ student: { ...buildDetail().student, id: "student-2", name: "Dana Osei" } })} />,
    );

    expect(markup).toContain('href="/cfi-v2/students/student-2/flights/new"');
  });
});
