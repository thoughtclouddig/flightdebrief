/**
 * In-memory cache for generated TTS audio, keyed by whatever content it was
 * generated from + voice (see callers in app/api/*\/audio/route.ts). A
 * debrief's narration never changes once written, so regenerating it via
 * Deepgram on every single click (each taking many seconds -- see
 * lib/deepgram-tts.ts's note on batch vs streaming latency) is pure waste.
 *
 * Deliberately simple: process-lifetime only, doesn't survive a cold start
 * or scale-out to multiple instances. A real fix (persisting to whatever
 * database ends up backing this app) is a natural fast-follow once that's
 * settled -- this solves "every click is slow," not "the first click is slow."
 */
const cache = new Map<string, Buffer>();

/**
 * A cache key that includes what was actually said.
 *
 * Keys used to be (subject, voice) on the stated assumption that "a debrief's
 * narration never changes once written". That held until the narration
 * builder changed: fixing the script to stop reading a student's own words
 * back at them had no audible effect, because every listener was served audio
 * synthesized before the fix. The same applies to a scenario whose text is
 * edited -- the corrected ATIS call would have gone on playing the old one.
 *
 * Hashing the script makes the key describe the audio rather than its
 * subject, so a script change is a cache miss by construction and nobody has
 * to remember to invalidate anything.
 */
export function audioCacheKey(subject: string, voice: string, script: string): string {
  let hash = 0;
  for (let i = 0; i < script.length; i++) {
    hash = (hash * 31 + script.charCodeAt(i)) | 0;
  }
  return `${subject}:${voice}:${Math.abs(hash).toString(36)}`;
}

/**
 * Headers for narration audio.
 *
 * "private" because these routes are per-user access-controlled and a shared
 * cache could serve one student's audio to another. Deliberately NOT
 * immutable: the URL carries no version, so a browser told to keep the file
 * for a week would replay a superseded script no matter what the server
 * decided. Revalidating costs a request; the expensive part -- synthesis --
 * is still saved by the cache above.
 */
export const NARRATION_AUDIO_HEADERS = {
  "Content-Type": "audio/mpeg",
  "Cache-Control": "private, max-age=0, must-revalidate",
};

export function getCachedAudio(key: string): Buffer | null {
  return cache.get(key) ?? null;
}

export function setCachedAudio(key: string, audio: Buffer): void {
  cache.set(key, audio);
}
