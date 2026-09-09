import { analyzeMock } from "./mock-analyzer";
import { analyzeWithClaude } from "./claude-analyzer";
import { stripUnsupportedParticipantReferences } from "./participant-validation";
import { suggestStudyReferences } from "@/lib/topics";
import type { AnalyzeDebriefInput, StructuredDebriefResult } from "./schema";

export type { AnalyzeDebriefInput, StructuredDebriefResult } from "./schema";

export interface AnalyzeResult {
  structured: StructuredDebriefResult;
  analyzedWith: "claude" | "mock";
}

/** Server-only. Runs Claude when ANTHROPIC_API_KEY is set, otherwise the local heuristic analyzer. */
export async function analyzeDebrief(input: AnalyzeDebriefInput): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasInstructor = input.flightMeta.hasInstructor;
  if (apiKey) {
    try {
      const structured = stripUnsupportedParticipantReferences(await analyzeWithClaude(input, apiKey), hasInstructor);
      // Study references always come from our curated FAA-reference table, never
      // from the model, so chapter/handbook citations can't be hallucinated.
      // Computed from needsWork/actionItems AFTER the participant-reference
      // strip above, so a study reference never survives keyed off a
      // needsWork entry that was just dropped for claiming instructor
      // participation that didn't happen.
      structured.studyReferences = suggestStudyReferences([...structured.needsWork, ...structured.actionItems]);
      structured.assessmentDifferences = input.assessmentDifferences ?? [];
      return { structured, analyzedWith: "claude" };
    } catch (err) {
      console.error("[AI] Claude analysis failed, falling back to mock analyzer:", err);
      return {
        structured: withAssessmentDifferences(stripUnsupportedParticipantReferences(analyzeMock(input), hasInstructor), input),
        analyzedWith: "mock",
      };
    }
  }
  console.log("[AI] using local mock analyzer — set ANTHROPIC_API_KEY to use Claude");
  return {
    structured: withAssessmentDifferences(stripUnsupportedParticipantReferences(analyzeMock(input), hasInstructor), input),
    analyzedWith: "mock",
  };
}

function withAssessmentDifferences(structured: StructuredDebriefResult, input: AnalyzeDebriefInput): StructuredDebriefResult {
  structured.assessmentDifferences = input.assessmentDifferences ?? [];
  return structured;
}
