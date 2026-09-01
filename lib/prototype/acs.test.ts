import { describe, expect, it } from "vitest";
import { ACS_STRUCTURE, acsReadiness, taskForSkill, taskProgress } from "@/lib/prototype/acs";
import { SKILL_SCORES } from "@/lib/prototype/vector-data";

/**
 * The ACS view is a second ORGANIZATION of the same evidence, never a second
 * scoring model. These tests hold that line and keep the two views from
 * quietly disagreeing about which task a skill belongs to.
 */

describe("the published structure", () => {
  it("is Area of Operation -> Task, with codes on the tasks", () => {
    expect(ACS_STRUCTURE.length).toBeGreaterThanOrEqual(2);
    for (const group of ACS_STRUCTURE) {
      expect(group.tasks.length).toBeGreaterThan(0);
      for (const t of group.tasks) expect(t.code).toMatch(/^PA\.[IVX]+\.[A-Z]$/);
    }
  });

  it("has no duplicate task codes", () => {
    const codes = ACS_STRUCTURE.flatMap((g) => g.tasks.map((t) => t.code));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("references only skills that exist, and claims each one once", () => {
    const slugs = ACS_STRUCTURE.flatMap((g) => g.tasks.flatMap((t) => t.skills));
    for (const slug of slugs) expect(SKILL_SCORES.some((s) => s.slug === slug)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps every skill's own ACS metadata in step with the task that claims it", () => {
    // The two views showed different codes for the same skill before this
    // existed. Skill detail says PA.IV.B; the ACS tab must agree.
    for (const skill of SKILL_SCORES) {
      const found = taskForSkill(skill.slug);
      expect(found, `${skill.slug} is not under any ACS task`).toBeDefined();
      expect(found!.task.code).toBe(skill.acsCode);
      expect(found!.area).toBe(skill.acsArea);
    }
  });

  it("includes tasks with no assessment behind them", () => {
    // This is the whole point of the view: a skills list can only ever show
    // what has been assessed, and the checkride question is mostly about what
    // has not been.
    const unassessed = ACS_STRUCTURE.flatMap((g) => g.tasks).filter((t) => t.skills.length === 0);
    expect(unassessed.length).toBeGreaterThan(0);
  });
});

describe("task rollup", () => {
  it("stands at the weakest assessed skill under it", () => {
    // Normal Approach and Landing carries Crosswind (Improving) and
    // Stabilized Approach (Needs Work).
    const task = ACS_STRUCTURE[0]!.tasks.find((t) => t.code === "PA.IV.B")!;
    const p = taskProgress(task);
    expect(p.skills).toHaveLength(2);
    expect(p.state).toBe("Needs Work");
    expect(p.score).toBe(2);
  });

  it("reports null rather than zero when nothing has been assessed", () => {
    // A 0-of-4 meter would claim an assessment of zero where there is none.
    const task = ACS_STRUCTURE[0]!.tasks.find((t) => t.code === "PA.IV.M")!;
    const p = taskProgress(task);
    expect(p.state).toBeNull();
    expect(p.score).toBeNull();
    expect(p.skills).toEqual([]);
  });

  it("uses the same three states as everywhere else", () => {
    const states = ACS_STRUCTURE.flatMap((g) => g.tasks.map((t) => taskProgress(t).state));
    for (const s of states) {
      if (s !== null) expect(["Needs Work", "Improving", "Meets Standard"]).toContain(s);
    }
  });
});

describe("readiness summary", () => {
  const acs = acsReadiness();

  it("counts assessed tasks meeting standard, out of assessed and not out of all", () => {
    expect(acs.meetingStandard).toBe(2); // Short-Field Landing, Radio Work
    expect(acs.assessed).toBe(3);
    expect(acs.meetingStandard).toBeLessThanOrEqual(acs.assessed);
  });

  it("always carries the not-assessed count alongside it", () => {
    // Without this the summary reads as "two-thirds ready", which is the
    // aggregate readiness verdict this product does not make.
    expect(acs.notAssessed).toBeGreaterThan(0);
    expect(acs.assessed + acs.notAssessed).toBe(acs.total);
  });

  it("exposes no percentage, ratio or overall verdict", () => {
    const keys = Object.keys(acs);
    expect(keys.filter((k) => /percent|ratio|readyScore|overall|verdict|grade/i.test(k))).toEqual([]);
    for (const k of ["assessed", "meetingStandard", "notAssessed", "total"] as const) {
      expect(Number.isInteger(acs[k])).toBe(true);
    }
  });
});
