import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

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

  const response = await fetch(`https://api.deepgram.com/v2/speak?model=${voice}&speed=1`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Deepgram TTS failed (${response.status}): ${detail || "no response body"}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
