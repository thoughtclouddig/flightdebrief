import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";
import { splitForTts } from "@/lib/tts-chunks";

/**
 * Flux TTS batch REST call (see lib/tts-voices.ts for how the voice slugs were
 * confirmed). Called directly via fetch rather than @deepgram/sdk -- the
 * installed SDK version predates Flux/the /v2/speak endpoint.
 *
 * Returns the full audio buffer rather than passing the response stream
 * through, so callers can cache it (see lib/audio-cache.ts) -- this batch
 * endpoint has to fully render the audio server-side before sending any of
 * it back anyway (unlike Deepgram's WebSocket streaming mode), so buffering
 * here costs nothing extra.
 */
/**
 * Throws (rather than returning null) on any non-2xx response, carrying the
 * real Deepgram status/body in the error message -- callers surface this in
 * the API response body itself (see app/api/*\/audio/route.ts), not just a
 * server log, since server logs have proven unreliable to retrieve in some
 * environments (Replit's shell pane) while the browser Network tab's
 * response body has not.
 */
export async function synthesizeSpeech(text: string, apiKey: string, requestedVoice: string | null): Promise<Buffer> {
  const voice = requestedVoice && isValidTtsVoice(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;

  // The endpoint hard-rejects input over 2000 characters with a 413, which a
  // real debrief exceeds routinely -- the script grows with the length of the
  // lesson. Synthesize each piece and join the results (see splitForTts).
  const chunks = splitForTts(text);
  if (chunks.length === 0) {
    throw new Error("Deepgram TTS failed: nothing to synthesize.");
  }

  // Sequential, not Promise.all: these are large responses and firing a dozen
  // at once is how you find the account's rate limit. A debrief is a handful
  // of chunks, and the result is cached per (flight, voice) afterward.
  const parts: Buffer[] = [];
  for (const [index, chunk] of chunks.entries()) {
    const response = await fetch(`https://api.deepgram.com/v2/speak?model=${voice}&speed=0.9&expressivity=1`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: chunk }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const where = chunks.length > 1 ? ` [part ${index + 1} of ${chunks.length}]` : "";
      throw new Error(`Deepgram TTS failed (${response.status})${where}: ${detail || "no response body"}`);
    }

    parts.push(Buffer.from(await response.arrayBuffer()));
  }

  // MP3 is a sequence of self-contained frames, so concatenating the responses
  // yields one continuous stream every browser decoder plays start to finish.
  return parts.length === 1 ? parts[0]! : Buffer.concat(parts);
}
