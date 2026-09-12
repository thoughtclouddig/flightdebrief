import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVectorSession, rehearsalEngineFor, resolveVectorStrategy } from "./vector-coaching";

const CFI = "Danny";

describe("buildVectorSession — every card's one button, always a real link", () => {
  it("links to /train/vector/<itemId>", () => {
    expect(buildVectorSession("item-123")).toEqual({ buttonLabel: "Train with Vector", href: "/train/vector/item-123" });
  });

  it("always returns the same literal button label", () => {
    expect(buildVectorSession("a").buttonLabel).toBe("Train with Vector");
    expect(buildVectorSession("b").buttonLabel).toBe("Train with Vector");
  });
});

describe("rehearsalEngineFor — real capability availability, independent of mechanism", () => {
  it("finds the real Chair Fly engine whenever the skill itself has an authored scenario", () => {
    expect(rehearsalEngineFor("CROSSWIND_LANDING")).toEqual({ kind: "chair-fly" });
  });

  it("finds the real Radio Practice engine for radio communications", () => {
    expect(rehearsalEngineFor("RADIO_COMMUNICATIONS")).toEqual({ kind: "radio-practice" });
  });

  it("never claims Radio Practice for a physical/procedural skill a scenario merely happens to touch -- category must be COMMUNICATIONS too", () => {
    expect(rehearsalEngineFor("GO_AROUND")).not.toEqual({ kind: "radio-practice" });
  });

  it("never claims Radio Practice for a COMMUNICATIONS skill the scenario bank has no real scenario for", () => {
    expect(rehearsalEngineFor("ATC_LIGHT_SIGNALS")).toBeNull();
  });

  it("returns null for a skill with no authored engine at all", () => {
    expect(rehearsalEngineFor("STEEP_TURNS")).toBeNull();
  });
});

describe("resolveVectorStrategy — round 1, mechanism known -- category decides, never a preliminary quiz", () => {
  it("A: a sequencing/rehearsal mechanism goes straight to Chair Fly, no diagnostic question", () => {
    const result = resolveVectorStrategy({
      skill: "CROSSWIND_LANDING",
      mechanism: { quote: "You're still relaxing the correction once you get into the flare.", source: "instructor", category: "SEQUENCING_REHEARSAL" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "chair-fly" });
  });

  it("a communication-performance mechanism goes straight to Radio Practice, framed as rehearsal (train), not diagnosis", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: { quote: "You forgot to read back the altitude restriction.", source: "instructor", category: "COMMUNICATION_PERFORMANCE" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "radio-practice", mode: "train" });
  });

  it("an understanding/knowledge mechanism goes straight to direct coaching from the quote, no quiz", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      mechanism: { quote: "You lost altitude because you didn't add enough back-pressure.", source: "instructor", category: "UNDERSTANDING_KNOWLEDGE" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("coach");
    expect(result.kind === "coach" && result.message).toContain("You lost altitude because you didn't add enough back-pressure.");
  });

  it("a mechanism with no legitimate ground capability at all transfers, framed from the quote itself -- never a dead end", () => {
    const result = resolveVectorStrategy({
      skill: "PREFLIGHT_INSPECTION",
      mechanism: { quote: "You skipped the fuel sump check.", source: "instructor", category: "FLIGHT_EXECUTION_TRANSFER" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("transfer");
    expect(result.kind === "transfer" && result.objective).toContain("You skipped the fuel sump check.");
    expect(result.kind === "transfer" && result.objective).toContain(CFI);
  });
});

describe("resolveVectorStrategy — round 1, mechanism unknown -- a legitimate diagnostic path, or transfer, never a dead end", () => {
  it("B: an ambiguous communications gap diagnoses via the real Radio Practice activity itself", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: null,
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "radio-practice", mode: "diagnose" });
  });

  it("C: an ambiguous knowledge gap, with curated content and no performance engine, diagnoses via Vector's own bounded Q&A", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      mechanism: null,
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("check");
    expect(result.kind === "check" && result.question.prompt).toBeTruthy();
  });

  it("never jumps to Chair Fly just because it exists when mechanism is unknown -- diagnoses via curated Q&A first even though CROSSWIND_LANDING also has a Chair Fly engine", () => {
    // Chair Fly produces no result (by design), so it can never diagnose
    // anything -- an unknown mechanism must not silently default to it just
    // because it happens to exist for this skill.
    const result = resolveVectorStrategy({
      skill: "CROSSWIND_LANDING",
      mechanism: null,
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).not.toBe("chair-fly");
    expect(result.kind).toBe("check");
  });

  it("never jumps to Chair Fly just because it exists when neither mechanism nor any diagnostic content exists -- transfers instead", () => {
    const result = resolveVectorStrategy({
      skill: "SOFT_FIELD_LANDING", // no checkQuestion, no Chair Fly scenario, no Radio Practice coverage
      mechanism: null,
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "the soft-field landing note from your last debrief",
    });
    expect(result.kind).toBe("transfer");
  });

  it("D: no diagnostic path and no mechanism at all transfers using this unit's own evidence, never a manufactured quiz", () => {
    const result = resolveVectorStrategy({
      skill: "PREFLIGHT_INSPECTION",
      mechanism: null,
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "the fuel sump note from your last debrief",
    });
    expect(result).toEqual({ kind: "transfer", objective: expect.stringContaining("the fuel sump note from your last debrief") });
  });
});

describe("resolveVectorStrategy — round 2, real activity evidence decides the next move, never the skill alone", () => {
  it("a correct Radio Practice diagnostic result transfers with a positive, evidence-grounded objective", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: null,
      activityEvidence: { kind: "radio-practice", correct: true, matchedElements: [{ description: "aircraft callsign", matched: true }] },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("transfer");
  });

  it("an incorrect Radio Practice diagnostic result transfers, framed by the specific required element actually missed", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: null,
      activityEvidence: {
        kind: "radio-practice",
        correct: false,
        matchedElements: [
          { description: "aircraft callsign", matched: true },
          { description: "altitude restriction readback", matched: false },
        ],
      },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("transfer");
    expect(result.kind === "transfer" && result.objective).toContain("altitude restriction readback");
  });

  it("a solid Vector Q&A result legitimately re-opens Chair Fly for a skill that has one -- understanding is now established, not assumed", () => {
    const result = resolveVectorStrategy({
      skill: "CROSSWIND_LANDING",
      mechanism: null,
      activityEvidence: { kind: "check", matchedConceptCount: 3, expectedConceptCount: 3, takeaway: "Hold the correction through touchdown." },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "chair-fly" });
  });

  it("a weak Vector Q&A result transfers using the evaluator's own takeaway, never loops indefinitely", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      mechanism: null,
      activityEvidence: { kind: "check", matchedConceptCount: 0, expectedConceptCount: 3, takeaway: "Add back-pressure as bank increases." },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "transfer", objective: expect.stringContaining("Add back-pressure as bank increases.") });
  });

  it("a solid Vector Q&A result with no rehearsal engine transfers instead of inventing one", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      mechanism: null,
      activityEvidence: { kind: "check", matchedConceptCount: 3, expectedConceptCount: 3, takeaway: "Add back-pressure as bank increases." },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("transfer");
  });
});

describe("resolveVectorStrategy — recurrence/progression is never a valid input", () => {
  it("has no parameter at all for progression/recurrence status -- it cannot independently select transfer, by construction", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/progression|recurr/i);
  });
});

describe("vector-coaching.ts never calls an LLM", () => {
  it("has no import of any AI/model client -- routing decisions are pure and deterministic", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/anthropic|claude|openai|from ["']@\/lib\/ai/i);
  });
});
