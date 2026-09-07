import { stripSpokenActionLabel } from "@/lib/narration";

/**
 * Browser acceptance found Ava's "Current training" showing near-duplicate
 * bullets: "Still working on..." and "Work on: Still working on...". The
 * two come from different underlying action-item sources (keepWorkingOn vs.
 * beforeFlightItems) that can independently describe the same thing, one of
 * them carrying the analyzer's literal "Work on:" heading (see
 * lib/ai/mock-analyzer.ts) that lib/narration.ts's stripSpokenActionLabel
 * already exists to strip for exactly this "same text as the frame around
 * it" reason. Reused here rather than reimplemented: compare (and display)
 * items with that label stripped, so a merely-differently-labeled repeat
 * collapses into one bullet under a section already titled "Working on."
 *
 * Presentation-only -- never touches stored TrainingItem text. Exact-match
 * after stripping a known literal prefix, not semantic/AI deduplication:
 * two genuinely different sentences are never merged.
 */
export function dedupeWorkingOnItems(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of items) {
    const stripped = stripSpokenActionLabel(raw);
    const key = stripped.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(stripped);
  }
  return result;
}
