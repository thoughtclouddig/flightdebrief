import { z } from "zod";

const performanceLevelSchema = z.enum(["LEARNING", "NEEDS_COACHING", "INDEPENDENT"]);

export const structuredDebriefSchema = z.object({
  // Claude never reliably populates this (see lib/ai/index.ts -- it's optional
  // here so validation doesn't fail if the model omits it, but the mock
  // analyzer and Claude prompt both populate it directly, unlike
  // assessmentDifferences below which is always computed, never asked for).
  flightSummary: z.string().default(""),
  whatWeDid: z.array(z.string()).default([]),
  wentWell: z.array(z.string()).default([]),
  needsWork: z.array(z.string()).default([]),
  instructorGuidance: z
    .array(
      z.object({
        instructorName: z.string(),
        quote: z.string(),
      }),
    )
    .default([]),
  // Factual "CFI intervened/prompted/corrected" observations -- distinct from
  // instructorGuidance's verbatim attributed quotes.
  instructorAssistance: z.array(z.string()).default([]),
  riskManagementNotes: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  nextLessonFocus: z.array(z.string()).default([]),
  studyReferences: z
    .array(
      z.object({
        topic: z.string(),
        source: z.string(),
        // Claude never populates this (see lib/ai/index.ts -- studyReferences are
        // always overwritten with the curated FAA-reference table afterward), so
        // accept its absence here and default to "" rather than failing validation.
        url: z
          .string()
          .optional()
          .transform((v) => v ?? ""),
      }),
    )
    .default([]),
  // Always computed deterministically from debrief_assessment_ratings in
  // lib/ai/index.ts, never asked of Claude -- we already have ground truth,
  // same "don't let the model reconstruct what we can compute exactly" rule
  // as studyReferences. Zod default([]) here only covers older/freeform
  // debriefs where no assessments exist.
  assessmentDifferences: z
    .array(
      z.object({
        taskLabel: z.string(),
        studentLevel: performanceLevelSchema,
        instructorLevel: performanceLevelSchema,
        note: z.string(),
      }),
    )
    .default([]),
});

export type StructuredDebriefResult = z.infer<typeof structuredDebriefSchema>;

export interface AnalyzeDebriefInput {
  transcript: string;
  flightMeta: {
    tailNumber: string;
    aircraftType: string;
    departureAirport: string;
    arrivalAirport: string;
    flightDate: string;
    durationMinutes: number;
    instructorName: string | null;
  };
  previousActionItems: string[];
  /**
   * Pre-computed by the caller from debrief_assessment_ratings (guided/light
   * mode only) and assigned onto the result unconditionally after analysis --
   * see the flightSummary/assessmentDifferences comments above for why this
   * never goes through the LLM. Omitted/empty for freeform-mode debriefs.
   */
  assessmentDifferences?: StructuredDebriefResult["assessmentDifferences"];
}
