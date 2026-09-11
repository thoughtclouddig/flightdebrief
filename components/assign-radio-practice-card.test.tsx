import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssignRadioPracticeCard } from "./assign-radio-practice-card";
import type { RadioPracticeAssignment } from "@/lib/types";

function assignment(overrides: Partial<RadioPracticeAssignment> = {}): RadioPracticeAssignment {
  return {
    id: "assignment-1",
    organizationId: "org-1",
    studentId: "student-1",
    assignedBy: "cfi-1",
    scenarioId: "line-up-and-wait",
    status: "assigned",
    transcript: null,
    correct: null,
    matchedElements: null,
    attempts: 0,
    completedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AssignRadioPracticeCard -- picker vs. assigned-list contradiction", () => {
  it("with no assignments: labels the picker and the empty state as separate things", () => {
    const markup = renderToStaticMarkup(
      <AssignRadioPracticeCard studentId="student-1" initialAssignments={[]} suggestedScenarioId={null} />,
    );

    expect(markup).toContain("Assign a new scenario");
    expect(markup).toContain("Assigned");
    expect(markup).toContain("Nothing assigned yet.");
  });

  it("the picker's default selected scenario never renders inside the Assigned block", () => {
    const markup = renderToStaticMarkup(
      <AssignRadioPracticeCard studentId="student-1" initialAssignments={[]} suggestedScenarioId={null} />,
    );

    // "Nothing assigned yet." must be the only content in the Assigned section
    // -- the picker's pre-selected <option> title is real markup elsewhere on
    // the page, but it must not read as an assignment.
    const assignedSection = markup.split("Assigned</p>")[1] ?? "";
    expect(assignedSection).toContain("Nothing assigned yet.");
  });

  it("with a real assignment: 'Nothing assigned yet.' must not appear", () => {
    const markup = renderToStaticMarkup(
      <AssignRadioPracticeCard studentId="student-1" initialAssignments={[assignment()]} suggestedScenarioId={null} />,
    );

    expect(markup).not.toContain("Nothing assigned yet.");
    expect(markup).toContain("Assigned");
  });
});
