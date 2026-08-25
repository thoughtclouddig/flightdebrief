import { describe, expect, it } from "vitest";
import { buildNextLessonNarration } from "./next-lesson-narration";

const BASE_INPUT = {
  studentFirstName: "Mia",
  flightDate: "2026-08-20",
  whatWeDid: ["steep turns"],
  keepWorkingOn: ["pattern consistency"],
  beforeToday: ["review the checklist"],
  focus: ["stabilized approaches"],
};

describe("buildNextLessonNarration", () => {
  it("attributes today's focus to the CFI by first name when known", () => {
    const script = buildNextLessonNarration({ ...BASE_INPUT, instructorFirstName: "Jake" });
    expect(script).toContain("Jake wants you to focus on");
    expect(script).not.toContain("null");
    expect(script).not.toContain("undefined");
  });

  it('falls back to "your instructor" when no instructor is assigned', () => {
    const script = buildNextLessonNarration({ ...BASE_INPUT, instructorFirstName: null });
    expect(script).toContain("Your instructor wants you to focus on");
    expect(script).not.toContain("null");
  });
});
