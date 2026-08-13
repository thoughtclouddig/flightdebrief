import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

/**
 * Flux TTS batch REST call (see lib/tts-voices.ts for how the voice slugs were
 * confirmed). Called directly via fetch rather than @deepgram/sdk -- the
 * installed SDK version predates Flux/the /v2/speak endpoint.
 */
export async function synthesizeSpeech(text: string, apiKey: string, requestedVoice: string | null) {
  const voice = requestedVoice && isValidTtsVoice(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;

  const response = await fetch(`https://api.deepgram.com/v2/speak?model=${voice}&speed=1`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok || !response.body) {
    return null;
  }

  return response.body;
}
