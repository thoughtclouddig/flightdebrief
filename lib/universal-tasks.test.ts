import { describe, it, expect } from "vitest";
import { UNIVERSAL_TASKS, isUniversalTask, partitionTasks, withUniversalTasks } from "./universal-tasks";

const chosen = (taskCode: string, label = taskCode) => ({
  taskCode,
  label,
  source: "instructor_selected" as const,
});

describe("withUniversalTasks", () => {
  it("adds every-flight tasks to a selection", () => {
    const merged = withUniversalTasks([chosen("SHORT_FIELD_LANDING", "Short-field landings")]);
    expect(merged).toHaveLength(1 + UNIVERSAL_TASKS.length);
    expect(merged.map((t) => t.taskCode)).toContain("RADIO_COMMUNICATIONS");
  });

  it("puts the lesson first", () => {
    // Three fixed rows above the lesson every time would bury the reason the
    // flight happened.
    const merged = withUniversalTasks([chosen("STEEP_TURNS")]);
    expect(merged[0].taskCode).toBe("STEEP_TURNS");
  });

  it("does not duplicate one the instructor chose deliberately", () => {
    const merged = withUniversalTasks([chosen("RADIO_COMMUNICATIONS", "Class D radio work")]);
    const radio = merged.filter((t) => t.taskCode === "RADIO_COMMUNICATIONS");
    expect(radio).toHaveLength(1);
    // Their label and their source survive -- the selection is theirs.
    expect(radio[0].label).toBe("Class D radio work");
    expect(radio[0].source).toBe("instructor_selected");
  });

  it("still adds them when nothing was chosen", () => {
    expect(withUniversalTasks([])).toHaveLength(UNIVERSAL_TASKS.length);
  });
});

describe("partitionTasks", () => {
  it("separates the lesson from the every-flight block", () => {
    const { lesson, universal } = partitionTasks([
      { taskCode: "STEEP_TURNS" },
      { taskCode: "PREFLIGHT_INSPECTION" },
      { taskCode: "RADIO_COMMUNICATIONS" },
    ]);
    expect(lesson.map((t) => t.taskCode)).toEqual(["STEEP_TURNS"]);
    expect(universal).toHaveLength(2);
  });

  it("treats a CFI's custom task as lesson content", () => {
    const { lesson } = partitionTasks([{ taskCode: "CUSTOM:abc123" }]);
    expect(lesson).toHaveLength(1);
  });
});

describe("isUniversalTask", () => {
  it("recognizes only the fixed three", () => {
    expect(isUniversalTask("PREFLIGHT_INSPECTION")).toBe(true);
    expect(isUniversalTask("SHORT_FIELD_LANDING")).toBe(false);
  });
});
