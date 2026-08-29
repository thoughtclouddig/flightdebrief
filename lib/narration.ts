/** Shared helper for turning a list of short text fragments into spoken-friendly prose (see lib/*-narration.ts). */

function stripTrailingPeriod(s: string): string {
  return s.endsWith(".") ? s.slice(0, -1) : s;
}

const DIGIT_WORDS: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "niner",
};

function digitsToWords(digits: string): string {
  return digits
    .split("")
    .map((d) => DIGIT_WORDS[d] ?? d)
    .join(" ");
}

const RUNWAY_SIDE_WORDS: Record<string, string> = { L: "left", R: "right", C: "center" };

/**
 * Rewrites aviation numeric references into ICAO-style digit-by-digit
 * phraseology before TTS synthesis -- e.g. "runway 27" -> "runway two
 * seven", not a general-purpose TTS engine's default "runway twenty-seven".
 * Applied only to the spoken script (see app/api/*\/audio/route.ts callers);
 * on-screen text is never touched, so this can be tuned freely without
 * risking a written debrief reading oddly.
 */
export function toPilotSpeak(text: string): string {
  let out = text;

  // Runway numbers: "runway 27", "Runway 9L", "runway 04R" -- always spoken
  // as two digits even below 10, matching real ATC phraseology. The side
  // letter (if any) is always a direct suffix on the number, never
  // space-separated, so this must NOT allow whitespace before it -- an
  // earlier \s*([LRC])? here greedily ate the space after a plain "27 was"
  // and glued the next word onto "seven".
  out = out.replace(/\brunway\s+(\d{1,2})([LRC])?\b/gi, (_m, num: string, side?: string) => {
    const spoken = digitsToWords(num.padStart(2, "0"));
    const sideWord = side ? ` ${RUNWAY_SIDE_WORDS[side.toUpperCase()] ?? ""}` : "";
    return `runway ${spoken}${sideWord}`;
  });

  // Headings: "heading 270", "heading of 090" -- always three digits.
  out = out.replace(/\bheading(?:\s+of)?\s+(\d{1,3})\b/gi, (_m, num: string) => `heading ${digitsToWords(num.padStart(3, "0"))}`);

  // Radio frequencies: "118.3", "121.5" -- digit-by-digit with "point".
  out = out.replace(
    /\b(\d{3})\.(\d{1,3})\b/g,
    (_m, whole: string, frac: string) => `${digitsToWords(whole)} point ${digitsToWords(frac)}`,
  );

  return out;
}

/**
 * Joins items into "A", "A and B", or "A, B, and C" -- with any trailing
 * period on individual items stripped first, since callers wrap the result
 * in their own sentence (e.g. `` `Before you fly: ${speakList(items)}.` ``)
 * and items are often already-punctuated sentences pulled straight from a
 * debrief (e.g. "Radio calls were solid today.").
 */
export function speakList(items: string[]): string {
  const cleaned = items.map(stripTrailingPeriod);
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

/**
 * Rewrites first-person text into second person for a spoken brief.
 *
 * Items carried into a brief are pulled from a debrief, where somebody said
 * them out loud in the first person: "Nina had me work on getting configured
 * earlier on downwind, so I'm not rushed on base." Spoken back to the student
 * by a narrator, that lands as the narrator claiming the student's own
 * experience -- the effect the user described as "he's saying it as if Nina
 * said it". The information is right; the person is wrong.
 *
 * Deliberately a small, testable substitution rather than a model call. This
 * runs on every brief, adds no latency, and cannot invent anything: it only
 * ever changes pronouns. Text already in second person passes through
 * untouched, so an item written as guidance stays as written.
 *
 * Doesn't handle everything English can do -- "myself" mid-clause, reported
 * speech nested two deep. It handles what debrief sentences actually contain,
 * and anything it misses is left alone rather than mangled.
 */
const PERSON_SUBSTITUTIONS: [RegExp, string][] = [
  // Contractions before bare pronouns: "I'm" must not be reached by the "I"
  // rule first, which would leave "you'm".
  [/\bI'm\b/gi, "you're"],
  [/\bI've\b/gi, "you've"],
  [/\bI'll\b/gi, "you'll"],
  [/\bI'd\b/gi, "you'd"],
  [/\bI\b/g, "you"],
  // "my" before "me": otherwise "my" is untouched and reads as the narrator's.
  [/\bmyself\b/gi, "yourself"],
  [/\bmine\b/gi, "yours"],
  [/\bmy\b/gi, "your"],
  [/\bme\b/gi, "you"],
  // Verb agreement follows the pronoun swap: "I was" -> "you was" without it.
  [/\byou was\b/g, "you were"],
  [/\byou am\b/g, "you are"],
];

export function toSecondPerson(text: string): string {
  // Transcripts and model output both use the typographic apostrophe, and
  // every contraction rule below is written with a straight one -- without
  // this, "I'm" with a curly apostrophe passes through untouched.
  let out = text.replace(/\u2019/g, "'");
  for (const [pattern, replacement] of PERSON_SUBSTITUTIONS) {
    out = out.replace(pattern, replacement);
  }
  // A sentence that began "I" now begins "you", mid-paragraph and lowercase.
  // Only matters once these strings got long enough to contain more than one
  // sentence -- which they did the moment the narrative recap went through
  // here rather than a list of short items.
  out = out.replace(/([.!?]\s+)(you|your)\b/g, (_, punctuation: string, word: string) =>
    `${punctuation}${word.charAt(0).toUpperCase()}${word.slice(1)}`,
  );

  // Match the original's opening case rather than always capitalising. These
  // strings are sometimes a whole sentence and sometimes a fragment dropped
  // into the middle of one ("Nina pointed out: <fragment>"), and capitalising
  // a fragment mid-sentence is its own small wrongness.
  const startedUpper = /^[A-Z]/.test(text);
  if (startedUpper) return out.charAt(0).toUpperCase() + out.slice(1);
  return out.charAt(0).toLowerCase() + out.slice(1);
}

/**
 * Whether an item reads as a complete sentence rather than a noun phrase.
 *
 * The scripts wrap items in prepositional frames -- "Keep an eye on X", "was
 * X" -- which need a noun phrase. Training items are sometimes that ("your
 * flare timing") and sometimes a whole sentence ("Nina had you work on
 * getting configured earlier on downwind"). Slotting the second into the
 * first produces "Keep an eye on Nina had you work on...", which is not
 * English.
 *
 * The test is a subject-verb pattern rather than length: "getting configured
 * earlier on downwind" is long and still a phrase, while "Nina had you work"
 * is short and a sentence.
 */
const SENTENCE_SHAPE = /\b(had|has|have|was|were|is|are|did|does|wants?|told|asked|said|needs?|should|will|kept|keeps)\b/i;

export function readsAsSentence(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // A leading capital that isn't just an acronym or a name-led phrase.
  return SENTENCE_SHAPE.test(trimmed) && trimmed.split(/\s+/).length > 3;
}

/**
 * Frames a list of items for speech, choosing based on their shape.
 *
 * Phrases go inside the caller's frame ("Keep an eye on A and B"). Sentences
 * are spoken on their own after a short lead-in, because no prepositional
 * frame survives a sentence being dropped into it.
 */
export function speakItems(items: string[], phraseFrame: (list: string) => string, sentenceLead: string): string {
  const phrases = items.filter((i) => !readsAsSentence(i));
  const sentences = items.filter(readsAsSentence);

  const parts: string[] = [];
  if (phrases.length > 0) parts.push(phraseFrame(speakList(phrases)));
  if (sentences.length > 0) {
    parts.push(`${sentenceLead} ${sentences.map((s) => endWithPeriod(s)).join(" ")}`);
  }
  return parts.join(" ");
}

function endWithPeriod(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
