import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RadioPracticeSession } from "./radio-practice-session";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import type { RadioPracticeAssignment } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

const SCENARIO = RADIO_PRACTICE_SCENARIOS[0]!;

function assignment(overrides: Partial<RadioPracticeAssignment> = {}): RadioPracticeAssignment {
  return {
    id: "assignment-1",
    organizationId: "org-1",
    studentId: "student-1",
    assignedBy: null,
    scenarioId: SCENARIO.id,
    status: "completed",
    transcript: "Cessna one two three, taxi to runway two seven.",
    correct: true,
    matchedElements: [{ description: "aircraft callsign", matched: true }],
    attempts: 1,
    trainingItemId: null,
    completedAt: "2026-08-20T20:00:00.000Z",
    createdAt: "2026-08-20T19:00:00.000Z",
    ...overrides,
  };
}

describe("RadioPracticeSession — the Vector return path never breaks standalone practice", () => {
  it("shows Continue with Vector, linked to the exact originating training unit, only when this attempt was launched from Vector", () => {
    const markup = renderToStaticMarkup(
      <RadioPracticeSession assignment={assignment({ trainingItemId: "item-1" })} scenario={SCENARIO} next={null} />,
    );
    expect(markup).toContain("Continue with Vector");
  });

  it("never shows Continue with Vector for a normal standalone attempt", () => {
    const markup = renderToStaticMarkup(<RadioPracticeSession assignment={assignment({ trainingItemId: null })} scenario={SCENARIO} next={null} />);
    expect(markup).not.toContain("Continue with Vector");
  });
});
