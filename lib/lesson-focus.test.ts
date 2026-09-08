import { describe, expect, it } from "vitest";
import { deriveLessonFocus } from "./lesson-focus";

function task(label: string, sortOrder: number) {
  return { label, sortOrder };
}

describe("deriveLessonFocus", () => {
  it("returns null for an empty task list", () => {
    expect(deriveLessonFocus([])).toBeNull();
  });

  it("combines landing tasks sharing the 'landing[s]' suffix into one segment", () => {
    // The real Mia fixture case: two landing tasks collapse into a single
    // segment, so the MAX_FOCUS_SEGMENTS cap doesn't affect it.
    const tasks = [task("Crosswind landings", 1), task("Short-field landings", 2)];
    expect(deriveLessonFocus(tasks)).toBe("Crosswind + Short-Field Landings");
  });

  it("joins a landing segment and one other segment -- exactly at the cap", () => {
    const tasks = [task("Crosswind landings", 1), task("Radio communication", 2)];
    expect(deriveLessonFocus(tasks)).toBe("Crosswind Landings + Radio Communication");
  });

  it("returns null once the objective list produces more than MAX_FOCUS_SEGMENTS distinct segments", () => {
    // The real observed Staging bug: six freeform-selected objectives with no
    // shared landing suffix, which used to concatenate into one giant title.
    const tasks = [
      task("Weather & go/no-go decision", 1),
      task("Preflight inspection", 2),
      task("Slow flight", 3),
      task("Power-off stalls", 4),
      task("Radio communication", 5),
      task("Situational awareness", 6),
    ];
    expect(deriveLessonFocus(tasks)).toBeNull();
  });

  it("a bare 'Landings' task contributes nothing on its own", () => {
    expect(deriveLessonFocus([task("Landings", 1)])).toBeNull();
  });
});
