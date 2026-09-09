/**
 * Deterministic gate on whether a recorded debrief transcript has enough
 * real content to send to the AI analyzer at all -- separate from, and
 * upstream of, lib/ai/prompt.ts's own "don't invent unsupported claims"
 * instructions. Those instructions ask the model to leave fields empty when
 * the transcript doesn't support them; they cannot force it to comply. A
 * real Staging test recorded "This is a test. This is a test..." and still
 * got back a full structured debrief and a ~42-second synthesized recap --
 * the model didn't follow its own instructions, and nothing downstream
 * checked. This is the backstop: content this thin never reaches the model,
 * so there's nothing for it to fabricate from.
 *
 * Deliberately not aviation-aware. It has no idea what a crosswind is and
 * never will -- it only asks "does this transcript have enough distinct
 * words to plausibly describe an actual flight," which is answerable
 * without any domain knowledge and without another AI call.
 *
 * Three signals, in order of how directly they catch junk:
 *   - total word count: catches "hello", a single word, anything trivially
 *     short.
 *   - unique word count: catches short filler blocks that inflate raw
 *     length by repeating themselves ("um um um uh uh okay okay").
 *   - unique-word ratio: catches longer repetition ("This is a test." said
 *     four times in a row is 16 words, past the raw-length floor, but only
 *     4 of them are distinct).
 *
 * Thresholds are conservative on purpose -- rejecting a real debrief is a
 * worse failure than accepting a marginal one, since rejection blocks the
 * whole result and repetition is a much stronger junk signal than brevity
 * alone.
 */

const MIN_TOTAL_WORDS = 12;
const MIN_UNIQUE_WORDS = 8;
const MIN_UNIQUE_RATIO = 0.5;

/** Pure verbal disfluencies only -- never a word that could carry real content, so stripping them can't hide genuine substance. */
const FILLER_WORDS = new Set(["um", "umm", "uh", "uhh", "ah", "er", "hmm"]);

export type TranscriptAdequacyReason = "empty" | "too_short" | "too_repetitive";

export interface TranscriptAdequacy {
  adequate: boolean;
  /** Null when adequate. Distinguishes the three rejection shapes for logging/telemetry -- the user-facing copy is the same for all three. */
  reason: TranscriptAdequacyReason | null;
}

function tokenize(transcript: string): string[] {
  return transcript
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(Boolean)
    .filter((word) => !FILLER_WORDS.has(word));
}

export function assessTranscriptAdequacy(transcript: string): TranscriptAdequacy {
  const words = tokenize(transcript);

  if (words.length === 0) return { adequate: false, reason: "empty" };
  if (words.length < MIN_TOTAL_WORDS) return { adequate: false, reason: "too_short" };

  const uniqueWords = new Set(words);
  if (uniqueWords.size < MIN_UNIQUE_WORDS) return { adequate: false, reason: "too_repetitive" };
  if (uniqueWords.size / words.length < MIN_UNIQUE_RATIO) return { adequate: false, reason: "too_repetitive" };

  return { adequate: true, reason: null };
}
