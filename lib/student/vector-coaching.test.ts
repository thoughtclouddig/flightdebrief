import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVectorSession, resolveVectorCapability } from "./vector-coaching";
import { curatedTrainingGuidance } from "@/lib/topics";

describe("buildVectorSession — every card's one button, always a real link", () => {
  it("links to /train/vector/<itemId>", () => {
    expect(buildVectorSession("item-123")).toEqual({ buttonLabel: "Train with Vector", href: "/train/vector/item-123" });
  });

  it("always returns the same literal button label", () => {
    expect(buildVectorSession("a").buttonLabel).toBe("Train with Vector");
    expect(buildVectorSession("b").buttonLabel).toBe("Train with Vector");
  });
});

describe("resolveVectorCapability — what /train/vector/[itemId] actually does", () => {
  it("hands off to the real Chair Fly engine whenever the skill itself has an authored scenario -- no dual-assessment requirement", () => {
    expect(resolveVectorCapability({ skill: "CROSSWIND_LANDING" })).toEqual({ kind: "chair-fly" });
  });

  it("hands off to the real Radio Practice engine for radio communications", () => {
    expect(resolveVectorCapability({ skill: "RADIO_COMMUNICATIONS" })).toEqual({ kind: "radio-practice" });
  });

  it("never offers Chair Fly for a skill with no authored scenario -- falls back to the grounded check instead", () => {
    const result = resolveVectorCapability({ skill: "STEEP_TURNS" });
    expect(result.kind).toBe("check");
  });

  it("runs Vector's own grounded check, with real curated guidance, for a skill with no interactive engine", () => {
    const result = resolveVectorCapability({ skill: "STEEP_TURNS" });
    expect(result).toEqual({ kind: "check", guidance: curatedTrainingGuidance("STEEP_TURNS") });
    expect(result.kind === "check" && result.guidance?.checkQuestion).toBeTruthy();
  });

  it("degrades to a null-guidance check, never invented, for a skill with no curated content at all", () => {
    expect(curatedTrainingGuidance("PREFLIGHT_INSPECTION")).toBeNull();
    expect(resolveVectorCapability({ skill: "PREFLIGHT_INSPECTION" })).toEqual({ kind: "check", guidance: null });
  });

  it("degrades to a null-guidance check for the honest 'general' fallback (no resolved skill)", () => {
    expect(resolveVectorCapability({ skill: "general" })).toEqual({ kind: "check", guidance: null });
  });
});

describe("vector-coaching.ts never calls an LLM", () => {
  it("has no import of any AI/model client -- routing decisions are pure and deterministic", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/anthropic|claude|openai|from ["']@\/lib\/ai/i);
  });
});
