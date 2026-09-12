import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVectorSession, evidenceForSkill, resolveVectorCapability } from "./vector-coaching";
import { curatedTrainingGuidance } from "@/lib/topics";
import type { AssessmentDifference, TrainingSignal } from "@/lib/types";

function contested(taskLabel: string): AssessmentDifference {
  return { taskLabel, studentLevel: "INDEPENDENT", instructorLevel: "NEEDS_COACHING", note: "" };
}

function signal(overrides: Partial<TrainingSignal> = {}): TrainingSignal {
  return {
    id: "signal-1",
    organizationId: "org-1",
    studentId: "student-1",
    instructorId: "cfi-1",
    aircraftId: null,
    flightId: "flight-1",
    debriefId: "debrief-1",
    flightDate: "2026-08-20",
    category: "LANDINGS",
    skill: "CROSSWIND_LANDING",
    status: "NEEDS_COACHING",
    source: "INSTRUCTOR",
    statement: "Drifting right in the flare.",
    dismissed: false,
    ...overrides,
  } as TrainingSignal;
}

describe("buildVectorSession — Train's one button, always a real link", () => {
  it("links to /train/vector/<skill> for a resolved skill", () => {
    expect(buildVectorSession("CROSSWIND_LANDING")).toEqual({
      buttonLabel: "Train with Vector",
      href: "/train/vector/CROSSWIND_LANDING",
    });
  });

  it("links to /train/vector/general when there's no resolved skill -- never a dead end", () => {
    expect(buildVectorSession(null)).toEqual({ buttonLabel: "Train with Vector", href: "/train/vector/general" });
  });

  it("always returns the same literal button label", () => {
    expect(buildVectorSession("RADIO_COMMUNICATIONS").buttonLabel).toBe("Train with Vector");
    expect(buildVectorSession(null).buttonLabel).toBe("Train with Vector");
  });
});

describe("resolveVectorCapability — what /train/vector/[skill] actually does", () => {
  it("hands off to the real Chair Fly engine when the contested objective has an authored scenario", () => {
    expect(resolveVectorCapability({ skill: "CROSSWIND_LANDING", contested: contested("Crosswind Landings") })).toEqual({
      kind: "chair-fly",
    });
  });

  it("hands off to the real Radio Practice engine for radio communications with no authored-scenario match", () => {
    expect(resolveVectorCapability({ skill: "RADIO_COMMUNICATIONS", contested: null })).toEqual({ kind: "radio-practice" });
  });

  it("prefers an authored Chair Fly scenario over Radio Practice when both could apply", () => {
    expect(
      resolveVectorCapability({ skill: "RADIO_COMMUNICATIONS", contested: contested("Crosswind Landings") }),
    ).toEqual({ kind: "chair-fly" });
  });

  it("never offers Chair Fly for a contested objective with no authored scenario -- falls back to the grounded check instead", () => {
    const result = resolveVectorCapability({ skill: "STEEP_TURNS", contested: contested("Steep turns") });
    expect(result.kind).toBe("check");
  });

  it("runs Vector's own grounded check, with real curated guidance, for a skill with no interactive engine", () => {
    const result = resolveVectorCapability({ skill: "STEEP_TURNS", contested: null });
    expect(result).toEqual({ kind: "check", guidance: curatedTrainingGuidance("STEEP_TURNS") });
    expect(result.kind === "check" && result.guidance?.checkQuestion).toBeTruthy();
  });

  it("degrades to a null-guidance check, never invented, for a skill with no curated content at all", () => {
    expect(curatedTrainingGuidance("PREFLIGHT_INSPECTION")).toBeNull();
    expect(resolveVectorCapability({ skill: "PREFLIGHT_INSPECTION", contested: null })).toEqual({
      kind: "check",
      guidance: null,
    });
  });

  it("degrades to a null-guidance check for the honest 'general' fallback (no resolved skill)", () => {
    expect(resolveVectorCapability({ skill: "general", contested: null })).toEqual({ kind: "check", guidance: null });
  });
});

describe("evidenceForSkill — real per-student evidence only, never a fixture", () => {
  it("returns the most recent instructor-sourced statement for the matching skill", () => {
    const signals = [
      signal({ id: "a", flightDate: "2026-08-01", statement: "Older note." }),
      signal({ id: "b", flightDate: "2026-08-20", statement: "Newer note." }),
      signal({ id: "c", skill: "STEEP_TURNS", flightDate: "2026-08-25", statement: "Different skill, ignored." }),
    ];
    expect(evidenceForSkill(signals, "CROSSWIND_LANDING")).toEqual({ text: "Newer note.", flightDate: "2026-08-20" });
  });

  it("ignores dismissed signals", () => {
    const signals = [signal({ dismissed: true, statement: "Dismissed, must not surface." })];
    expect(evidenceForSkill(signals, "CROSSWIND_LANDING")).toBeNull();
  });

  it("ignores a student-only-sourced statement -- only instructor evidence grounds Vector's session", () => {
    const signals = [signal({ source: "STUDENT", statement: "My own reflection, not instructor evidence." })];
    expect(evidenceForSkill(signals, "CROSSWIND_LANDING")).toBeNull();
  });

  it("returns null for the 'general' fallback -- nothing real to key evidence off of", () => {
    expect(evidenceForSkill([signal()], "general")).toBeNull();
  });
});

describe("vector-coaching.ts never calls an LLM", () => {
  it("has no import of any AI/model client -- routing decisions are pure and deterministic", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/anthropic|claude|openai|from ["']@\/lib\/ai/i);
  });
});
