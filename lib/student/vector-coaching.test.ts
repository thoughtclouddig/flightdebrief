import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVectorSession } from "./vector-coaching";
import { citationForSkill, curatedTrainingGuidance } from "@/lib/topics";
import type { AssessmentDifference } from "@/lib/types";

const HREFS = { chairFlyHref: "/train/chair-fly", radioPracticeHref: "/train/radio-practice" };

function contested(taskLabel: string): AssessmentDifference {
  return { taskLabel, studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" };
}

describe("buildVectorSession — routing", () => {
  it("routes to the real Chair Fly engine when the contested objective has an authored scenario", () => {
    const session = buildVectorSession({
      resolvedSkill: "CROSSWIND_LANDING",
      contested: contested("Crosswind Landings"),
      hrefs: HREFS,
    });
    expect(session.action).toEqual({
      kind: "chair-fly",
      href: "/train/chair-fly",
      caption: "About 4 minutes",
    });
  });

  it("routes to the real Radio Practice engine when the resolved skill is radio communications", () => {
    const session = buildVectorSession({ resolvedSkill: "RADIO_COMMUNICATIONS", contested: null, hrefs: HREFS });
    expect(session.action).toEqual({ kind: "radio-practice", href: "/train/radio-practice" });
  });

  it("never offers Chair Fly for a contested objective with no authored scenario -- an unsupported interactive skill still gets a session, just not that engine", () => {
    const session = buildVectorSession({
      resolvedSkill: "STEEP_TURNS",
      contested: contested("Steep turns"),
      hrefs: HREFS,
    });
    expect(session.action).toBeNull();
    expect(session.coaching).not.toBeNull();
  });

  it("prefers an authored Chair Fly scenario over Radio Practice when both could apply", () => {
    const session = buildVectorSession({
      resolvedSkill: "RADIO_COMMUNICATIONS",
      contested: contested("Crosswind Landings"),
      hrefs: HREFS,
    });
    expect(session.action?.kind).toBe("chair-fly");
  });

  it("never offers Radio Practice when the caller has no route for it", () => {
    const session = buildVectorSession({
      resolvedSkill: "RADIO_COMMUNICATIONS",
      contested: null,
      hrefs: { chairFlyHref: "/train/chair-fly" },
    });
    expect(session.action).toBeNull();
  });

  it("always returns the same literal button label regardless of branch", () => {
    const withAction = buildVectorSession({ resolvedSkill: "RADIO_COMMUNICATIONS", contested: null, hrefs: HREFS });
    const withoutAction = buildVectorSession({ resolvedSkill: "STEEP_TURNS", contested: null, hrefs: HREFS });
    expect(withAction.buttonLabel).toBe("Train with Vector");
    expect(withoutAction.buttonLabel).toBe("Train with Vector");
  });
});

describe("buildVectorSession — coaching content only ever comes from curated fields", () => {
  it("never fabricates preparationPoints/commonErrors -- they are exactly what lib/topics.ts's curatedTrainingGuidance returns", () => {
    const session = buildVectorSession({ resolvedSkill: "STABILIZED_APPROACH", contested: null, hrefs: HREFS });
    const curated = curatedTrainingGuidance("STABILIZED_APPROACH")!;
    expect(session.coaching!.preparationPoints).toEqual(curated.preparationPoints);
    expect(session.coaching!.commonErrors).toEqual(curated.commonErrors);
    expect(session.coaching!.citation).toEqual(curated.citation);
  });

  it("degrades to citation-only, honestly, for a skill with a verified source but no curated preparation content (GO_AROUND)", () => {
    const session = buildVectorSession({ resolvedSkill: "GO_AROUND", contested: null, hrefs: HREFS });
    expect(curatedTrainingGuidance("GO_AROUND")).toBeNull();
    expect(citationForSkill("GO_AROUND")).not.toBeNull();
    expect(session.coaching).not.toBeNull();
    expect(session.coaching!.preparationPoints).toEqual([]);
    expect(session.coaching!.commonErrors).toEqual([]);
    expect(session.coaching!.citation).toEqual(citationForSkill("GO_AROUND"));
  });

  it("degrades to null coaching, never invented, for a skill with neither curated content nor a verified citation (Preflight Inspection)", () => {
    expect(curatedTrainingGuidance("PREFLIGHT_INSPECTION")).toBeNull();
    expect(citationForSkill("PREFLIGHT_INSPECTION")).toBeNull();
    const session = buildVectorSession({ resolvedSkill: "PREFLIGHT_INSPECTION", contested: null, hrefs: HREFS });
    expect(session.coaching).toBeNull();
  });

  it("returns null coaching when there's no resolved skill to key off at all", () => {
    const session = buildVectorSession({ resolvedSkill: null, contested: null, hrefs: HREFS });
    expect(session.coaching).toBeNull();
    expect(session.action).toBeNull();
  });
});

describe("buildVectorSession — physical-skill framing", () => {
  it("attaches the in-aircraft-instruction caveat for a physical skill with no interactive engine (Landings)", () => {
    const session = buildVectorSession({ resolvedSkill: "STABILIZED_APPROACH", contested: null, hrefs: HREFS });
    expect(session.coaching!.physicalSkillNote).toMatch(/not a substitute for in-aircraft instruction/i);
  });

  it("never attaches the physical-skill caveat to a non-physical skill (Emergency Procedures is knowledge/procedure, not stick-and-rudder)", () => {
    const session = buildVectorSession({ resolvedSkill: "EMERGENCY_PROCEDURES", contested: null, hrefs: HREFS });
    expect(session.coaching!.physicalSkillNote).toBeNull();
  });

  it("never attaches the physical-skill caveat when a real engine already handles the recommendation (Chair Fly rehearsal is not a dead-end static card)", () => {
    const session = buildVectorSession({
      resolvedSkill: "CROSSWIND_LANDING",
      contested: contested("Crosswind Landings"),
      hrefs: HREFS,
    });
    expect(session.action?.kind).toBe("chair-fly");
    expect(session.coaching!.physicalSkillNote).toBeNull();
  });
});

describe("vector-coaching.ts never calls an LLM to generate coaching", () => {
  it("has no import of any AI/model client -- coaching text can only come from curated, human-reviewed fields", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/anthropic|claude|openai|from ["']@\/lib\/ai/i);
  });
});
