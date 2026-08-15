import type { TranscriptWord } from "@/lib/transcription/types";

/** A card's active recording window, logged locally by the Guided/Light recorder on Next/Back/Skip. */
export interface CardBoundary {
  cardId: string;
  startSeconds: number;
  /** null means "still active when recording ended" -- extends to the end of the word list. */
  endSeconds: number | null;
}

export interface TranscriptSegmentDraft {
  debriefCardId: string | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  speakerLabel: string | null;
}

function speakerLabelFor(words: TranscriptWord[]): string | null {
  const counts = new Map<number, number>();
  for (const w of words) {
    if (w.speaker === null) continue;
    counts.set(w.speaker, (counts.get(w.speaker) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const [dominant] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return `Speaker ${dominant}`;
}

/**
 * Pure function, no DB access -- intersects a session's word-level transcript
 * against each card's recorded time window to build one segment per card.
 * Words that fall outside every window (e.g. before the first card started)
 * are kept as a single debriefCardId: null segment rather than dropped.
 * Guided/Light mode only -- Freeform mode has no card boundaries and never
 * calls this.
 */
export function buildTranscriptSegments(words: TranscriptWord[], boundaries: CardBoundary[]): TranscriptSegmentDraft[] {
  if (words.length === 0) return [];

  const sortedBoundaries = [...boundaries].sort((a, b) => a.startSeconds - b.startSeconds);
  const lastWordEnd = words[words.length - 1].end;

  const segments: TranscriptSegmentDraft[] = [];
  const claimed = new Array<boolean>(words.length).fill(false);

  for (const boundary of sortedBoundaries) {
    const windowEnd = boundary.endSeconds ?? lastWordEnd;
    const windowWords: TranscriptWord[] = [];
    words.forEach((w, i) => {
      if (claimed[i]) return;
      if (w.start >= boundary.startSeconds && w.start < windowEnd) {
        claimed[i] = true;
        windowWords.push(w);
      }
    });
    if (windowWords.length === 0) continue;
    segments.push({
      debriefCardId: boundary.cardId,
      startSeconds: windowWords[0].start,
      endSeconds: windowWords[windowWords.length - 1].end,
      text: windowWords.map((w) => w.word).join(" "),
      speakerLabel: speakerLabelFor(windowWords),
    });
  }

  const unclaimed = words.filter((_, i) => !claimed[i]);
  if (unclaimed.length > 0) {
    segments.push({
      debriefCardId: null,
      startSeconds: unclaimed[0].start,
      endSeconds: unclaimed[unclaimed.length - 1].end,
      text: unclaimed.map((w) => w.word).join(" "),
      speakerLabel: speakerLabelFor(unclaimed),
    });
  }

  return segments.sort((a, b) => a.startSeconds - b.startSeconds);
}
