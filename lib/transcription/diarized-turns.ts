import type { TranscriptWord } from "@/lib/transcription/types";

/**
 * Collapses Deepgram's per-word diarization into speaker-labeled turns for
 * the analysis prompt (lib/ai/prompt.ts).
 *
 * Why this exists: diarization has always been captured on every word, but
 * the analyzer only ever received one flat block of text -- so it had to
 * infer who did what purely from wording ("Danny took the controls"), and
 * had no way to attribute a first-person line like "I took it from you
 * there" to the right person. Labeled turns give it something to reason
 * with.
 *
 * Deliberately NOT resolved to real names here. Diarization clusters voices
 * acoustically; it does not know which cluster is the instructor, and
 * guessing (e.g. "whoever spoke first must be the CFI") would manufacture
 * confident-looking attribution out of nothing. The labels stay neutral and
 * the prompt is told to infer roles from content, not from the numbers.
 */
export function buildDiarizedTurns(words: TranscriptWord[]): string | null {
  const speakers = new Set(words.map((w) => w.speaker).filter((s): s is number => s !== null));
  // One speaker (or none tagged) carries no attribution information the flat
  // transcript doesn't already have -- don't dress it up as a dialogue.
  if (speakers.size < 2) return null;

  const turns: { speaker: number | null; words: string[] }[] = [];
  for (const word of words) {
    const last = turns[turns.length - 1];
    if (last && last.speaker === word.speaker) last.words.push(word.word);
    else turns.push({ speaker: word.speaker, words: [word.word] });
  }

  return turns
    .map((t) => {
      const text = t.words.join(" ").trim();
      if (!text) return null;
      const label = t.speaker === null ? "Unknown" : `Speaker ${t.speaker + 1}`;
      return `${label}: ${text}`;
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}
