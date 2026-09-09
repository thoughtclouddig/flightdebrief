/**
 * Reconciles Deepgram's committed final transcript with whatever trailing
 * interim text never got promoted to final before finalize() completed (or
 * its backstop timeout gave up waiting) -- see use-deepgram-transcription.ts's
 * stop() for why leftover interim text exists at all.
 *
 * Not a naive concatenation. Interim results describe the same in-progress
 * utterance as it's refined, and Deepgram's endpointing/smart_format can
 * revise the last word or two of what was already finalized as more audio
 * arrives -- so a live interim update occasionally repeats a short tail of
 * already-finalized words instead of starting clean right after it.
 * Concatenating both blindly would duplicate that overlap; this finds the
 * longest run of already-finalized words that reappears at the start of the
 * interim text and drops it before appending the rest.
 */
export function mergeFinalAndInterim(finalText: string, interimText: string): string {
  const final = finalText.trim();
  const interim = interimText.trim();
  if (!interim) return final;
  if (!final) return interim;

  const finalWords = final.split(/\s+/);
  const interimWords = interim.split(/\s+/);
  const normalize = (word: string) => word.toLowerCase().replace(/[^\w']/g, "");

  // Longest suffix of finalWords that matches a prefix of interimWords,
  // tried longest-first so a short coincidental match (e.g. both start with
  // "the") doesn't win over a real, longer overlap.
  let overlap = 0;
  for (let len = Math.min(finalWords.length, interimWords.length); len > 0; len--) {
    const suffix = finalWords.slice(finalWords.length - len).map(normalize);
    const prefix = interimWords.slice(0, len).map(normalize);
    if (suffix.every((word, i) => word.length > 0 && word === prefix[i])) {
      overlap = len;
      break;
    }
  }

  const remainder = interimWords.slice(overlap).join(" ");
  return remainder ? `${final} ${remainder}` : final;
}
