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
