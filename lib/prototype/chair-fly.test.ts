import { describe, expect, it } from "vitest";
import { contestedObjective, recommendedDrill } from "@/lib/prototype/chair-fly";
import { PERCEPTION_GAPS, type GapRow } from "@/lib/prototype/vector-data";
import { agreement } from "@/lib/prototype/assessment";

/**
 * Guard tests for Chair Flying.
 *
 * Two of these exist to stop a specific future mistake rather than to prove
 * the code runs: the drill must stay generated from the last flight, and it
 * must never grow a scoring model. Changing either means changing a test,
 * which is the signal to stop and ask.
 */

describe("drill selection", () => {
  it("picks the objective the student rated above the instructor", () => {
    const gap = contestedObjective();
    expect(gap).not.toBeNull();
    expect(agreement(gap!.studentLevel, gap!.instructorLevel)).toBe("student_higher");
    // The seeded case: Mia felt solid about crosswinds, Jake did not.
    expect(gap!.task).toBe("Crosswind Landings");
  });

  it("prefers the largest disagreement", () => {
    const gaps: GapRow[] = [
      { ...PERCEPTION_GAPS[0]!, task: "Near", studentLevel: "NEEDS_COACHING", instructorLevel: "LEARNING" },
      { ...PERCEPTION_GAPS[0]!, task: "Far", studentLevel: "INDEPENDENT", instructorLevel: "LEARNING" },
    ];
    expect(contestedObjective(gaps)?.task).toBe("Far");
  });

  it("falls back to what the instructor left open when nobody disagreed", () => {
    const gaps: GapRow[] = [
      { ...PERCEPTION_GAPS[0]!, task: "Agreed solid", studentLevel: "INDEPENDENT", instructorLevel: "INDEPENDENT" },
      { ...PERCEPTION_GAPS[0]!, task: "Agreed open", studentLevel: "NEEDS_COACHING", instructorLevel: "NEEDS_COACHING" },
    ];
    expect(contestedObjective(gaps)?.task).toBe("Agreed open");
  });

  it("returns no drill at all rather than a generic one", () => {
    // Nothing contested and nothing open -> contestedObjective yields null,
    // and a null objective must not fall through to stock content.
    const gaps: GapRow[] = [
      { ...PERCEPTION_GAPS[0]!, task: "All good", studentLevel: "INDEPENDENT", instructorLevel: "INDEPENDENT" },
    ];
    expect(contestedObjective(gaps)).toBeNull();
  });
});

describe("the recommended drill", () => {
  const drill = recommendedDrill()!;

  it("is built from the last flight's own debrief", () => {
    expect(drill.objective).toBe("Crosswind Landings");
    expect(drill.skill).toBe("Crosswind Landing");
    // The reason carries both ratings and the instructor's actual sentence.
    expect(drill.reason.studentLabel).toBe("Felt Solid");
    expect(drill.reason.instructorLabel).toBe("Improving");
    expect(drill.reason.evidence).toContain("relaxing the correction");
    expect(drill.reason.instructorName).toBe("Jake");
  });

  it("includes at least one judgment beat", () => {
    // A rehearsal that is only procedure teaches sequence, not decision.
    expect(drill.steps.filter((s) => s.kind === "judgment").length).toBeGreaterThanOrEqual(1);
  });

  it("offers the go-around as a legitimate option, not a failure", () => {
    const judgment = drill.steps.find((s) => s.kind === "judgment")!;
    const goAround = judgment.options.find((o) => /go around/i.test(o.text))!;
    expect(goAround).toBeDefined();
    expect(goAround.response).toMatch(/legitimate|normal/i);
  });

  it("ties exactly one beat to the instructor's own note", () => {
    const attributed = drill.steps.filter((s) => s.instructorNote);
    expect(attributed).toHaveLength(1);
    expect(attributed[0]!.id).toBe("rollout");
    expect(attributed[0]!.instructorNote).toContain("through touchdown");
  });

  it("carries 2-3 items into the next flight, and names the flight", () => {
    expect(drill.carryForward.length).toBeGreaterThanOrEqual(2);
    expect(drill.carryForward.length).toBeLessThanOrEqual(3);
    expect(drill.nextFlight.when).toBe("Thursday");
    expect(drill.nextFlight.focus).toBe("Crosswind correction through touchdown");
  });

  it("points back to the instructor and the POH rather than replacing them", () => {
    expect(drill.guardrail).toMatch(/POH/);
    expect(drill.guardrail).toMatch(/instructor/i);
  });

  it("states a duration derived from its own content", () => {
    expect(drill.estimatedMinutes).toBeGreaterThanOrEqual(3);
    expect(drill.estimatedMinutes).toBeLessThanOrEqual(7);
  });
});

describe("Chair Flying is not an assessment layer", () => {
  const drill = recommendedDrill()!;

  it("has no correctness flag on any option", () => {
    // A boolean here is the thing a future session would count, and a count
    // is a score. Coaching is prose; there is nothing to tally.
    for (const step of drill.steps) {
      for (const option of step.options) {
        expect(Object.keys(option).sort()).toEqual(["id", "response", "text"]);
      }
    }
  });

  it("exposes no score, level, points or percentage anywhere on the drill", () => {
    const banned = /\b(score|points?|percent|percentage|grade|passed?|failed?|stars?|mastery|streak|rating)\b/i;
    const keys = JSON.stringify(drill, (k, v) => (typeof k === "string" && banned.test(k) ? undefined : v));
    expect(Object.keys(drill).filter((k) => banned.test(k))).toEqual([]);
    // And no user-visible copy quietly announcing one.
    expect(keys).not.toMatch(/\b\d+\s*(%|points?|out of \d)/i);
  });

  it("gives every option a response, so no choice is silently marked wrong", () => {
    for (const step of drill.steps) {
      expect(step.options.length).toBeGreaterThanOrEqual(2);
      for (const option of step.options) expect(option.response.length).toBeGreaterThan(40);
    }
  });
});
