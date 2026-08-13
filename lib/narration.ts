/** Shared helper for turning a list of short text fragments into spoken-friendly prose (see lib/*-narration.ts). */

function stripTrailingPeriod(s: string): string {
  return s.endsWith(".") ? s.slice(0, -1) : s;
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
