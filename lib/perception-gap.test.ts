import { describe, expect, it } from "vitest";
import { buildPerceptionGapRow, gapDirection, alignmentSummary } from "./perception-gap";

const base = { taskLabel: "Crosswind Landings", status: "significant" as const };

describe("buildPerceptionGapRow", () => {
  it("renders two perspectives instead of a scoreboard", () => {
    const row = buildPerceptionGapRow({ ...base, studentLevel: "INDEPENDENT", instructorLevel: "LEARNING" });
    expect(row.studentView).toContain("You felt");
    expect(row.instructorView).toContain("Your instructor");
    expect(row.interpretation).toBeTruthy();
  });

  // The whole point of the reframe: a gap is information about the lesson,
  // never a finding against either person.
  it("never blames the student, the instructor, or the instruction", () => {
    const levels = ["LEARNING", "NEEDS_COACHING", "INDEPENDENT"] as const;
    for (const s of levels) {
      for (const i of levels) {
        const row = buildPerceptionGapRow({ ...base, studentLevel: s, instructorLevel: i });
        const all = `${row.studentView} ${row.instructorView} ${row.interpretation ?? ""}`.toLowerCase();
        expect(all).not.toMatch(/wrong|failed|overconfident|didn't communicate|did not communicate|poor|deficien/);
      }
    }
  });

  it("prefers the instructor's own note over a generated sentence", () => {
    const row = buildPerceptionGapRow({
      ...base,
      studentLevel: "INDEPENDENT",
      instructorLevel: "NEEDS_COACHING",
      note: "Still drifting right of centerline in the flare.",
    });
    expect(row.instructorView).toBe("Still drifting right of centerline in the flare.");
  });

  it("has no interpretation when the two agree", () => {
    const row = buildPerceptionGapRow({
      taskLabel: "Radio Work",
      studentLevel: "INDEPENDENT",
      instructorLevel: "INDEPENDENT",
      status: "none",
    });
    expect(row.interpretation).toBeNull();
    expect(row.direction).toBe("aligned");
  });

  it("reads the gap in both directions", () => {
    expect(gapDirection("INDEPENDENT", "LEARNING")).toBe("student_higher");
    expect(gapDirection("LEARNING", "INDEPENDENT")).toBe("instructor_higher");
    const encouraging = buildPerceptionGapRow({
      ...base,
      status: "minor",
      studentLevel: "LEARNING",
      instructorLevel: "NEEDS_COACHING",
    });
    // A student who is harder on themselves than their CFI should not be
    // told they were wrong -- they should be told they're closer than they think.
    expect(encouraging.interpretation).toContain("closer than you think");
  });
});

describe("alignmentSummary", () => {
  it("leads with agreement, never a failure count", () => {
    const rows = [
      buildPerceptionGapRow({ taskLabel: "A", studentLevel: "INDEPENDENT", instructorLevel: "INDEPENDENT", status: "none" }),
      buildPerceptionGapRow({ taskLabel: "B", studentLevel: "INDEPENDENT", instructorLevel: "LEARNING", status: "significant" }),
    ];
    expect(alignmentSummary(rows)).toContain("1 of 2 the same way");
  });

  it("says so plainly when they agreed on everything", () => {
    const rows = [
      buildPerceptionGapRow({ taskLabel: "A", studentLevel: "INDEPENDENT", instructorLevel: "INDEPENDENT", status: "none" }),
    ];
    expect(alignmentSummary(rows)).toContain("the same way, all the way through");
  });
});
