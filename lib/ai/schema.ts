import { z } from "zod";

const performanceLevelSchema = z.enum(["LEARNING", "NEEDS_COACHING", "INDEPENDENT"]);

export const structuredDebriefSchema = z.object({
  // Claude never reliably populates this (see lib/ai/index.ts -- it's optional
  // here so validation doesn't fail if the model omits it, but the mock
  // analyzer and Claude prompt both populate it directly, unlike
  // assessmentDifferences below which is always computed, never asked for).
  flightSummary: z.string().default(""),
  // Spoken narrative for the "Listen to your debrief" audio -- see the
  // prompt for why this is generated once here (grounded in the same facts
  // as everything else in this response) rather than templated afterward.
  narrativeRecap: z.string().default(""),
  whatWeDid: z.array(z.string()).default([]),
  wentWell: z.array(z.string()).default([]),
  needsWork: z.array(z.string()).default([]),
  // Belt-and-braces against the model echoing its own attribution into the
  // quote text (e.g. quote: "...winds are, Danny said.") -- the app already
  // prefixes every quote with "{instructorName} said:" wherever it's shown
  // (debrief-result-sections.tsx, debrief-narration.ts), so a leftover
  // attribution phrase inside the quote itself reads/sounds doubled. The
  // prompt now asks Claude not to include it in the first place; this strips
  // it if that instruction gets missed.
  instructorGuidance: z
    .array(
      z
        .object({
          instructorName: z.string(),
          quote: z.string(),
        })
        .transform(({ instructorName, quote }) => {
          const name = instructorName.trim() || "Instructor";
          const verb = "(?:said(?:\\s+to\\s+me)?|told me|had me|wanted me to)";
          const namePattern = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const leading = new RegExp(`^\\s*${namePattern}\\s+${verb}[,:]?\\s*`, "i");
          const trailing = new RegExp(`[,.]?\\s*${namePattern}\\s+${verb}\\.?\\s*$`, "i");
          const cleaned = quote.replace(leading, "").replace(trailing, "").trim();
          return { instructorName, quote: cleaned || quote };
        }),
    )
    .default([]),
  // Factual "CFI intervened/prompted/corrected" observations -- distinct from
  // instructorGuidance's verbatim attributed quotes.
  instructorAssistance: z.array(z.string()).default([]),
  riskManagementNotes: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  nextLessonFocus: z.array(z.string()).default([]),
  // Short, memorable cockpit mnemonic for the next flight -- unlike
  // studyReferences/assessmentDifferences below, this IS asked of Claude
  // directly (see the prompt), so it's a plain field, not deterministically
  // overwritten afterward.
  nextFlightCue: z.string().default(""),
  // What the cue is FOR. Without it a cue like "Full power. Hold brakes."
  // is unreadable a week later -- correct, but with no way to tell which
  // maneuver it belongs to. Empty for debriefs analyzed before this existed.
  nextFlightCueContext: z.string().default(""),
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
        why: z
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
  /**
   * Speaker-labeled version of the same transcript (lib/transcription/diarized-turns.ts).
   * Null when diarization found fewer than two distinct voices, or for an
   * older/freeform debrief with no per-word data -- callers must still always
   * pass `transcript`, which stays the authoritative text.
   */
  diarizedTurns?: string | null;
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
