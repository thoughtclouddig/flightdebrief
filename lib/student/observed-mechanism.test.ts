import { afterEach, describe, expect, it } from "vitest";
import { collectInstructorQuoteCandidates, resolveEvidenceInterpretation } from "./observed-mechanism";
import type { AssessmentDifference, InstructorGuidance } from "@/lib/types";

function difference(overrides: Partial<AssessmentDifference> = {}): AssessmentDifference {
  return {
    taskLabel: "Crosswind landings",
    studentLevel: "INDEPENDENT",
    instructorLevel: "NEEDS_COACHING",
    note: "You're still relaxing the correction once you get into the flare.",
    ...overrides,
  };
}

function guidance(overrides: Partial<InstructorGuidance> = {}): InstructorGuidance {
  return { instructorName: "Danny", quote: "Your radio work needs more confidence.", ...overrides };
}

describe("collectInstructorQuoteCandidates — assembly only, never a relevance or mechanism judgment", () => {
  it("includes the dual-assessment note, attributed to the CFI, when this unit's skill is the contested objective", () => {
    const candidates = collectInstructorQuoteCandidates([difference()], [], "CROSSWIND_LANDING", "Jake");
    expect(candidates).toEqual([{ quote: "You're still relaxing the correction once you get into the flare.", instructorName: "Jake" }]);
  });

  it("omits the dual-assessment note when it belongs to a different skill than this unit", () => {
    const candidates = collectInstructorQuoteCandidates([difference({ taskLabel: "Steep turns" })], [], "CROSSWIND_LANDING", "Jake");
    expect(candidates).toEqual([]);
  });

  it("omits the dual-assessment note when it's empty -- nothing was actually written", () => {
    const candidates = collectInstructorQuoteCandidates([difference({ note: "" })], [], "CROSSWIND_LANDING", "Jake");
    expect(candidates).toEqual([]);
  });

  it("includes every real instructorGuidance quote from the same debrief, verbatim, regardless of which skill it turns out to be about", () => {
    const candidates = collectInstructorQuoteCandidates([], [guidance(), guidance({ instructorName: "Danny", quote: "Nice job on the crosswind landings today." })], "RADIO_COMMUNICATIONS", "Danny");
    expect(candidates).toHaveLength(2);
    // Both included -- collectInstructorQuoteCandidates does not filter by
    // relevance to the skill; that judgment belongs to the bounded
    // extractor alone (lib/ai/evidence-mechanism.ts), not to this assembly step.
    expect(candidates.map((c) => c.quote)).toContain("Nice job on the crosswind landings today.");
  });

  it("combines both sources when both are present", () => {
    const candidates = collectInstructorQuoteCandidates([difference()], [guidance()], "CROSSWIND_LANDING", "Jake");
    expect(candidates).toHaveLength(2);
  });

  it("returns an empty list, honestly, when neither source has anything", () => {
    const candidates = collectInstructorQuoteCandidates([], [], "CROSSWIND_LANDING", "Jake");
    expect(candidates).toEqual([]);
  });
});

describe("resolveEvidenceInterpretation — degrades to null, never to a skill-derived guess", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = original;
  });

  it("returns null for an empty candidate list without ever calling out", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await resolveEvidenceInterpretation([], "Crosswind landings");
    expect(result).toBeNull();
  });

  it("returns null, not an exception, when there's no API key even with real candidates", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await resolveEvidenceInterpretation([{ quote: "test", instructorName: "Jake" }], "Crosswind landings");
    expect(result).toBeNull();
  });
});
