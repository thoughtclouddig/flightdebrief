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
export async function synthesizeSpeech(text: string, apiKey: string, requestedVoice: string | null): Promise<Buffer | null> {
  const voice = requestedVoice && isValidTtsVoice(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;

  // Slightly under 1x -- full speed read as rushed/robotic for a debrief
  // meant to be listened to relaxed (e.g. driving home). Re-tune if this
  // over/undershoots once heard against a real voice sample.
  const response = await fetch(`https://api.deepgram.com/v2/speak?model=${voice}&speed=0.92`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[deepgram-tts] synthesis failed (${response.status}) for voice=${voice}: ${detail}`);
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
}
