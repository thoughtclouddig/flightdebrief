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

export function getCachedAudio(key: string): Buffer | null {
  return cache.get(key) ?? null;
}

export function setCachedAudio(key: string, audio: Buffer): void {
  cache.set(key, audio);
}
