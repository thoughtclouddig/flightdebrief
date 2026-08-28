/**
 * Deepgram's /v2/speak rejects anything over 2000 characters with a 413
 * ("Input text exceeds maximum character limit of 2000"), which a real debrief
 * blows past easily -- a long lesson produces a long recap, and the script
 * grows with the number of action items and study references. Splitting lets
 * the narration be as long as it needs to be.
 *
 * The limit here is deliberately under 2000: the API counts what it receives,
 * and leaving headroom means a stray character can't push a chunk over.
 */
const DEEPGRAM_TTS_LIMIT = 1800;

/**
 * Split narration into pieces each within `limit` characters.
 *
 * Sentence boundaries first, so the synthesized audio breaks where a speaker
 * would pause rather than mid-clause -- chunk seams are audible, and a seam at
 * a period is indistinguishable from normal speech while one mid-sentence is
 * not. A single sentence longer than the limit (rare, but possible from a
 * run-on transcript) falls back to splitting on whitespace, which is still
 * better than cutting a word in half.
 *
 * Never returns an empty chunk -- the API 400s on empty input.
 */
export function splitForTts(text: string, limit: number = DEEPGRAM_TTS_LIMIT): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= limit) return [trimmed];

  const chunks: string[] = [];
  let current = "";

  const push = () => {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  };

  // Keep the terminator with the sentence it ends, so the TTS engine still
  // hears a full stop and intones it as one.
  for (const sentence of trimmed.split(/(?<=[.!?])\s+/)) {
    for (const piece of sentence.length > limit ? splitLongRun(sentence, limit) : [sentence]) {
      if (current && current.length + 1 + piece.length > limit) push();
      current = current ? `${current} ${piece}` : piece;
    }
  }
  push();

  return chunks;
}

/** Word-boundary fallback for a single "sentence" that is itself over the limit. */
function splitLongRun(sentence: string, limit: number): string[] {
  const pieces: string[] = [];
  let current = "";

  for (const word of sentence.split(/\s+/)) {
    if (current && current.length + 1 + word.length > limit) {
      pieces.push(current);
      current = "";
    }
    // A single word longer than the limit is pathological (a URL, a paste
    // artifact); hard-cut it rather than emitting an over-limit chunk.
    if (word.length > limit) {
      if (current) {
        pieces.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += limit) pieces.push(word.slice(i, i + limit));
      continue;
    }
    current = current ? `${current} ${word}` : word;
  }
  if (current) pieces.push(current);

  return pieces;
}
