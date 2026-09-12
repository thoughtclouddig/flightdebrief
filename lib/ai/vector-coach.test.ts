import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateVectorAnswer } from "./vector-coach";

const BASE_INPUT = {
  skillLabel: "Steep turns",
  question: "As you roll into a steep turn, why do you need to add back-pressure?",
  expectedConcepts: ["steeper bank increases load factor", "more back-pressure is needed to hold altitude"],
  explanation: "Steepening the bank increases the load factor, so the wing needs more lift to hold altitude.",
  studentEvidence: null,
  answer: "Because the load factor goes up as you bank more.",
};

describe("evaluateVectorAnswer — safe by construction when there's nothing to call", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = original;
  });

  it("returns null with no API key configured -- the caller falls back to the reviewed explanation, never an invented one", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await evaluateVectorAnswer(BASE_INPUT);
    expect(result).toBeNull();
  });

  it("returns null for an empty answer even with a key present -- nothing to grade", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const result = await evaluateVectorAnswer({ ...BASE_INPUT, answer: "   " });
    expect(result).toBeNull();
  });
});

describe("vector-coach.ts's grounding contract", () => {
  const source = readFileSync(new URL("./vector-coach.ts", import.meta.url), "utf8");

  it("explicitly prohibits inventing requirements, limitations, or knowledge beyond what's supplied", () => {
    expect(source).toMatch(/do not invent additional requirements/i);
    expect(source).toMatch(/do not draw on aviation knowledge outside the provided material/i);
  });

  it("explicitly prohibits treating generic guidance as an observation of this student without real evidence", () => {
    expect(source).toMatch(/never invent or paraphrase it as a new observation/i);
    expect(source).toMatch(/do not invent any/i);
  });

  it("filters the model's matchedConcepts down to only the concepts it was actually given -- never trusts free-text output to stay in-bounds on its own", () => {
    expect(source).toMatch(/allowed\.has/);
  });
});
