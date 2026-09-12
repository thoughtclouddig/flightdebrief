import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";

/**
 * Reads real instructor quotes from a single debrief to characterize
 * evidence for ONE training gap -- never to decide what Vector should do
 * about it. See lib/student/observed-mechanism.ts for how this fits into
 * the domain (collectInstructorQuoteCandidates assembles the candidates;
 * resolveVectorStrategy, not this file, ever picks Chair Fly / Radio
 * Practice / a check question / transfer).
 *
 * The safety property here is stronger than lib/ai/vector-coach.ts's: the
 * model is never asked to produce a quote string at all, only to pick an
 * index into a list WE supply and, separately, name one of five fixed
 * categories. The actual quote text that ever reaches a caller always
 * comes from OUR OWN array indexing (buildEvidenceInterpretation below),
 * never from the model's own text output -- there is no quote field in the
 * model's response schema for it to paraphrase, invent, or drift on.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 20_000;

export type MechanismCategory =
  | "UNDERSTANDING_KNOWLEDGE"
  | "RECOGNITION"
  | "SEQUENCING_REHEARSAL"
  | "COMMUNICATION_PERFORMANCE"
  | "FLIGHT_EXECUTION_TRANSFER";

const MECHANISM_CATEGORIES: readonly MechanismCategory[] = [
  "UNDERSTANDING_KNOWLEDGE",
  "RECOGNITION",
  "SEQUENCING_REHEARSAL",
  "COMMUNICATION_PERFORMANCE",
  "FLIGHT_EXECUTION_TRANSFER",
];

export interface InstructorQuoteCandidate {
  /** Verbatim -- see lib/ai/prompt.ts's own instruction to preserve the instructor's own words unparaphrased. */
  quote: string;
  instructorName: string;
}

export interface ObservedMechanism {
  /** Always one of the input candidates' own quote strings -- never model-generated text. */
  quote: string;
  category: MechanismCategory;
}

export interface EvidenceInterpretation {
  /** The one candidate judged relevant to this training gap. Valuable evidence on its own, even when observedMechanism is null. */
  instructorQuote: InstructorQuoteCandidate;
  /** Null whenever the relevant quote only names the topic area without describing a concrete mechanism -- a conservative null is correct, not a failure. */
  observedMechanism: ObservedMechanism | null;
}

const rawResponseSchema = z.object({
  selectedIndex: z.number().int().nullable().default(null),
  mechanismCategory: z.string().nullable().default(null),
});
type RawResponse = z.infer<typeof rawResponseSchema>;

const SYSTEM = `You are reading real instructor quotes from a single flight debrief to characterize evidence for ONE specific training gap. You are NOT deciding what training activity to use -- only describing what the evidence actually says. You have no knowledge of what training tools or activities exist, and must not assume any.

You are given a training gap's topic label, and a numbered list of real, verbatim instructor quotes from this same debrief. Some quotes may be about other topics entirely.

STEP 1 -- RELEVANCE
Pick the ONE quote (by its number) that is actually about this training gap's topic. If none of the quotes are about it, respond with selectedIndex: null.

STEP 2 -- MECHANISM (only meaningful if you picked a quote)
Decide whether THAT SAME quote explicitly names a concrete, specific mechanism -- a particular technique, timing, cue, or behavior -- as opposed to a general statement that only names the topic ("needs more work," "needs more confidence") without saying what specifically is wrong.

A general statement that only names the topic is NOT a mechanism, even though it is clearly relevant evidence. Only classify a mechanism when the quote itself describes a specific, concrete issue.

If it does name one, classify it as exactly one of:
- UNDERSTANDING_KNOWLEDGE: the student didn't know or understand something (a why/what, not a how).
- RECOGNITION: the student needs to identify a cue or situation.
- SEQUENCING_REHEARSAL: the student knows what to do but needs procedural or control-timing rehearsal (e.g. holding a correction, sequencing steps).
- COMMUNICATION_PERFORMANCE: a specific communication or phraseology behavior.
- FLIGHT_EXECUTION_TRANSFER: the quote itself says the remaining issue can only be resolved by flying or demonstrating it, not by more ground work.

If you are not confident the quote states a mechanism, or not confident which single category fits, respond with mechanismCategory: null. A conservative null is always correct over a guess.

Classify only from what the quote itself says. Never classify based on what training tools or activities might exist for this topic -- you do not know that and must not assume it.

Return ONLY this JSON, no fences, no commentary:
{"selectedIndex": <number or null>, "mechanismCategory": <one of the five category strings above, or null>}`;

/**
 * The mechanical grounding step, kept separate from the API call so it can
 * be exercised directly and deterministically: builds the final result
 * ONLY from candidates the caller supplied, never from anything in
 * `raw` except the index and category label. An out-of-range index, or a
 * category string outside the fixed five, degrades to the conservative
 * side (no mechanism, or no result at all) rather than trusting
 * unexpected model output.
 */
export function buildEvidenceInterpretation(raw: RawResponse, candidates: InstructorQuoteCandidate[]): EvidenceInterpretation | null {
  if (raw.selectedIndex === null || !Number.isInteger(raw.selectedIndex) || raw.selectedIndex < 0 || raw.selectedIndex >= candidates.length) {
    return null;
  }
  const selected = candidates[raw.selectedIndex]!;
  const category = MECHANISM_CATEGORIES.includes(raw.mechanismCategory as MechanismCategory) ? (raw.mechanismCategory as MechanismCategory) : null;
  return {
    instructorQuote: selected,
    observedMechanism: category ? { quote: selected.quote, category } : null,
  };
}

/**
 * Given every candidate instructor quote from one debrief
 * (lib/student/observed-mechanism.ts's collectInstructorQuoteCandidates)
 * and this training gap's topic label, returns which quote is relevant and
 * whether it states a mechanism -- or null when there's nothing to
 * interpret, no API key, or the model's response fails validation. Never
 * throws; every failure mode degrades to null, never to a skill-derived
 * guess.
 */
export async function extractEvidenceMechanism(candidates: InstructorQuoteCandidate[], skillLabel: string): Promise<EvidenceInterpretation | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || candidates.length === 0) return null;

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const prompt = `TRAINING GAP TOPIC: ${skillLabel}

INSTRUCTOR QUOTES FROM THIS DEBRIEF:
${candidates.map((c, i) => `${i}. (${c.instructorName}) "${c.quote}"`).join("\n")}`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const parsed = rawResponseSchema.safeParse(JSON.parse(extractJson(raw)));
    if (!parsed.success) return null;

    return buildEvidenceInterpretation(parsed.data, candidates);
  } catch (err) {
    console.error("[evidence-mechanism] extraction failed, degrading to no interpretation:", err);
    return null;
  }
}
