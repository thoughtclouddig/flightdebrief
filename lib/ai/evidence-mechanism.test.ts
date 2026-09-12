import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { buildEvidenceInterpretation, extractEvidenceMechanism } from "./evidence-mechanism";
import type { InstructorQuoteCandidate } from "./evidence-mechanism";

const CANDIDATES: InstructorQuoteCandidate[] = [
  { quote: "Your crosswind landings need more work.", instructorName: "Jake" },
  { quote: "You're still relaxing the correction once you get into the flare.", instructorName: "Jake" },
];

describe("extractEvidenceMechanism — safe by construction when there's nothing to call", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = original;
  });

  it("returns null with no API key configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await extractEvidenceMechanism(CANDIDATES, "Crosswind landings");
    expect(result).toBeNull();
  });

  it("returns null for an empty candidate list even with a key present -- nothing to interpret", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const result = await extractEvidenceMechanism([], "Crosswind landings");
    expect(result).toBeNull();
  });
});

describe("buildEvidenceInterpretation — the grounding contract, exercised directly", () => {
  it("A: a general topic-only comment is relevant evidence but never a mechanism", () => {
    const result = buildEvidenceInterpretation({ selectedIndex: 0, mechanismCategory: null }, CANDIDATES);
    expect(result).toEqual({
      instructorQuote: { quote: "Your crosswind landings need more work.", instructorName: "Jake" },
      observedMechanism: null,
    });
  });

  it("B: a quote explicitly describing a control/rehearsal problem becomes a SEQUENCING_REHEARSAL mechanism, quoted verbatim from the candidate", () => {
    const result = buildEvidenceInterpretation({ selectedIndex: 1, mechanismCategory: "SEQUENCING_REHEARSAL" }, CANDIDATES);
    expect(result).toEqual({
      instructorQuote: { quote: "You're still relaxing the correction once you get into the flare.", instructorName: "Jake" },
      observedMechanism: { quote: "You're still relaxing the correction once you get into the flare.", category: "SEQUENCING_REHEARSAL" },
    });
  });

  it("D: a quote about not understanding why becomes UNDERSTANDING_KNOWLEDGE, never routed anywhere by this function -- it only characterizes evidence", () => {
    const candidates: InstructorQuoteCandidate[] = [{ quote: "You seemed unsure why we were adding more aileron as we slowed.", instructorName: "Jake" }];
    const result = buildEvidenceInterpretation({ selectedIndex: 0, mechanismCategory: "UNDERSTANDING_KNOWLEDGE" }, candidates);
    expect(result?.observedMechanism).toEqual({ quote: candidates[0]!.quote, category: "UNDERSTANDING_KNOWLEDGE" });
  });

  it("E: a bare confidence statement carries no mechanism, even though it's clearly relevant", () => {
    const candidates: InstructorQuoteCandidate[] = [{ quote: "Your radio work needs more confidence.", instructorName: "Danny" }];
    const result = buildEvidenceInterpretation({ selectedIndex: 0, mechanismCategory: null }, candidates);
    expect(result).toEqual({ instructorQuote: { quote: "Your radio work needs more confidence.", instructorName: "Danny" }, observedMechanism: null });
  });

  it("F: a concrete, named omission becomes COMMUNICATION_PERFORMANCE", () => {
    const candidates: InstructorQuoteCandidate[] = [{ quote: "You kept leaving out your position when you called Tower.", instructorName: "Danny" }];
    const result = buildEvidenceInterpretation({ selectedIndex: 0, mechanismCategory: "COMMUNICATION_PERFORMANCE" }, candidates);
    expect(result?.observedMechanism?.category).toBe("COMMUNICATION_PERFORMANCE");
  });

  it("returns null entirely when no candidate is judged relevant", () => {
    const result = buildEvidenceInterpretation({ selectedIndex: null, mechanismCategory: null }, CANDIDATES);
    expect(result).toBeNull();
  });

  it("never trusts an out-of-range index -- degrades to null entirely rather than guessing a candidate", () => {
    expect(buildEvidenceInterpretation({ selectedIndex: 5, mechanismCategory: "SEQUENCING_REHEARSAL" }, CANDIDATES)).toBeNull();
    expect(buildEvidenceInterpretation({ selectedIndex: -1, mechanismCategory: null }, CANDIDATES)).toBeNull();
  });

  it("never trusts a category string outside the fixed five -- keeps the relevant quote but degrades mechanism to null, never to a skill-derived guess", () => {
    const result = buildEvidenceInterpretation({ selectedIndex: 0, mechanismCategory: "SOMETHING_THE_MODEL_MADE_UP" }, CANDIDATES);
    expect(result?.instructorQuote).toEqual(CANDIDATES[0]);
    expect(result?.observedMechanism).toBeNull();
  });

  it("the quote in the result is always the exact candidate string -- there is no field in the raw schema for the model to supply its own quote text at all", () => {
    // Structural guarantee, not just a runtime check: RawResponse only ever
    // carries selectedIndex/mechanismCategory (see the zod schema in
    // evidence-mechanism.ts) -- there is no "quote" key the model's JSON
    // could populate even if it tried.
    const result = buildEvidenceInterpretation({ selectedIndex: 1, mechanismCategory: "SEQUENCING_REHEARSAL" }, CANDIDATES);
    expect(result?.instructorQuote.quote).toBe(CANDIDATES[1]!.quote);
    expect(result?.observedMechanism?.quote).toBe(CANDIDATES[1]!.quote);
  });
});

describe("evidence-mechanism.ts's grounding rules, in the prompt itself", () => {
  const source = readFileSync(new URL("./evidence-mechanism.ts", import.meta.url), "utf8");

  it("explicitly forbids classifying from what training tools/activities exist", () => {
    expect(source).toMatch(/never classify based on what training tools or activities might exist/i);
    expect(source).toMatch(/you do not know that and must not assume it/i);
  });

  it("explicitly distinguishes a general topic-naming statement from a stated mechanism", () => {
    expect(source).toMatch(/general statement that only names the topic is not a mechanism/i);
  });

  it("explicitly instructs a conservative null over a guess", () => {
    expect(source).toMatch(/a conservative null is always correct over a guess/i);
  });

  it("never makes an instructional decision -- the SYSTEM prompt itself never names Chair Fly, Radio Practice, or transfer", () => {
    const systemPromptMatch = source.match(/const SYSTEM = `([\s\S]*?)`;/);
    expect(systemPromptMatch).toBeTruthy();
    expect(systemPromptMatch![1]).not.toMatch(/chair fly|radio practice/i);
  });
});
