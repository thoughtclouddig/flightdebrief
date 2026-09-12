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

describe("resolveVectorStrategy — round 1, mechanism known -- category decides, never a preliminary quiz, always capability-gated", () => {
  it("A: a sequencing/rehearsal mechanism goes straight to Chair Fly, no diagnostic question, when the engine actually exists", () => {
    const result = resolveVectorStrategy({
      skill: "CROSSWIND_LANDING",
      mechanism: { quote: "You're still relaxing the correction once you get into the flare.", category: "SEQUENCING_REHEARSAL" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "chair-fly" });
  });

  it("a communication-performance mechanism goes straight to Radio Practice, framed as rehearsal (train), not diagnosis, when the engine actually exists", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: { quote: "You forgot to read back the altitude restriction.", category: "COMMUNICATION_PERFORMANCE" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "radio-practice", mode: "train" });
  });

  it("an understanding/knowledge mechanism goes straight to direct coaching from the quote, no quiz", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      mechanism: { quote: "You lost altitude because you didn't add enough back-pressure.", category: "UNDERSTANDING_KNOWLEDGE" },
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
      mechanism: { quote: "You skipped the fuel sump check.", category: "FLIGHT_EXECUTION_TRANSFER" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("transfer");
    expect(result.kind === "transfer" && result.objective).toContain("You skipped the fuel sump check.");
    expect(result.kind === "transfer" && result.objective).toContain(CFI);
  });

  it("never routes to Chair Fly on a SEQUENCING_REHEARSAL mechanism when this skill has no authored Chair Fly scenario -- a word-derived category has no reason to agree with which engines happen to be authored", () => {
    // SOFT_FIELD_LANDING has no Chair Fly scenario at all. A mechanism
    // extracted purely from the instructor's words could still land on
    // this category for it -- the capability check must still gate it.
    const result = resolveVectorStrategy({
      skill: "SOFT_FIELD_LANDING",
      mechanism: { quote: "You touched down before establishing the pitch attitude.", category: "SEQUENCING_REHEARSAL" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).not.toBe("chair-fly");
    expect(result).toEqual({ kind: "transfer", objective: expect.stringContaining("You touched down before establishing the pitch attitude.") });
  });

  it("never routes to Radio Practice on a COMMUNICATION_PERFORMANCE mechanism when this skill has no real scenario coverage", () => {
    const result = resolveVectorStrategy({
      skill: "ATC_LIGHT_SIGNALS", // COMMUNICATIONS category, but no authored Radio Practice scenario
      mechanism: { quote: "You misread the steady green as a taxi clearance.", category: "COMMUNICATION_PERFORMANCE" },
      activityEvidence: null,
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).not.toBe("radio-practice");
    expect(result.kind).toBe("transfer");
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

describe("resolveVectorStrategy — round 2, Radio Practice's real diagnostic evidence actually affects the next move", () => {
  it("a correct Radio Practice attempt transfers, whatever the attempt count", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: null,
      activityEvidence: { kind: "radio-practice", correct: true, matchedElements: [{ description: "aircraft callsign", matched: true }], attempts: 1 },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).toBe("transfer");
  });

  it("the FIRST incorrect attempt offers one bounded retry, grounded in the specific required element actually missed -- never discarded", () => {
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
        attempts: 1,
      },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "radio-practice", mode: "retry", missedElement: "altitude restriction readback" });
  });

  it("after the retry, a still-incorrect attempt transfers, framed by whichever element is still missed -- no endless loop", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      mechanism: null,
      activityEvidence: {
        kind: "radio-practice",
        correct: false,
        matchedElements: [{ description: "altitude restriction readback", matched: false }],
        attempts: 2,
      },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "transfer", objective: expect.stringContaining("altitude restriction readback") });
  });
});

describe("resolveVectorStrategy — round 2, Vector's own bounded Q&A never reopens Chair Fly", () => {
  it("a perfect Q&A answer still transfers, never Chair Fly, even though this skill has an authored scenario -- a knowledge question proves only what it tested", () => {
    const result = resolveVectorStrategy({
      skill: "CROSSWIND_LANDING",
      mechanism: null,
      activityEvidence: { kind: "check", matchedConceptCount: 3, expectedConceptCount: 3, takeaway: "Hold the correction through touchdown." },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result.kind).not.toBe("chair-fly");
    expect(result).toEqual({ kind: "transfer", objective: expect.stringContaining("Hold the correction through touchdown.") });
  });

  it("a weak Q&A answer transfers using the evaluator's own takeaway, never loops indefinitely", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      mechanism: null,
      activityEvidence: { kind: "check", matchedConceptCount: 0, expectedConceptCount: 3, takeaway: "Add back-pressure as bank increases." },
      cfiName: CFI,
      fallbackEvidenceText: "fallback",
    });
    expect(result).toEqual({ kind: "transfer", objective: expect.stringContaining("Add back-pressure as bank increases.") });
  });
});

describe("resolveVectorStrategy — recurrence/progression is never a valid input", () => {
  it("has no parameter at all for progression/recurrence status -- it cannot independently select transfer, by construction", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/progression|recurr/i);
  });
});

describe("vector-coaching.ts never calls an LLM itself", () => {
  it("never invokes the evidence extractor or evaluator -- only borrows their already-computed result shapes (type-only imports)", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/anthropic|claude|openai/i);
    expect(source).not.toMatch(/extractEvidenceMechanism\(|evaluateVectorAnswer\(/);
    expect(source).toMatch(/import type \{[^}]*\} from "@\/lib\/ai\/evidence-mechanism"/);
  });
});
