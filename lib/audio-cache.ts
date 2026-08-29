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
import { getDb } from "@/lib/db";

/**
 * Process memory in front of Postgres.
 *
 * Memory alone meant every reload, deploy, or new instance started cold, and
 * the first listener after any of those waited the full synthesis again --
 * which on Replit, where the dev server reloads constantly, was most of the
 * time. The database makes a rendered script render once, ever.
 */
const memory = new Map<string, Buffer>();

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

export async function getCachedAudio(key: string): Promise<Buffer | null> {
  const hit = memory.get(key);
  if (hit) return hit;

  try {
    const { rows } = await getDb().query<{ audio: Buffer }>(
      "SELECT audio FROM audio_cache WHERE key = $1",
      [key],
    );
    if (!rows[0]) return null;
    memory.set(key, rows[0].audio);
    return rows[0].audio;
  } catch (err) {
    // A cache is an optimisation; a database problem here should slow the
    // request down, not fail it.
    console.error("[audio-cache] read failed:", err);
    return null;
  }
}

export async function setCachedAudio(key: string, audio: Buffer): Promise<void> {
  memory.set(key, audio);
  try {
    await getDb().query(
      "INSERT INTO audio_cache (key, audio) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
      [key, audio],
    );
  } catch (err) {
    console.error("[audio-cache] write failed:", err);
  }
}
