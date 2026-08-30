import { NextResponse } from "next/server";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { getCachedAudio, setCachedAudio, audioCacheKey } from "@/lib/audio-cache";
import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

/**
 * Pre-renders every scenario's ATC call into the audio cache.
 *
 * Scenario text is fixed content. Nothing about it is per-student, so the
 * only reason a student ever waits for Deepgram is that they happened to be
 * the first person to open that scenario on this database -- and production
 * starts with an empty cache after every deploy to a fresh environment.
 *
 * Deliberately an API route rather than a script. The cache key comes from
 * audioCacheKey() here, exactly as the playback route derives it. A script
 * would have to re-derive the key itself, and that is precisely how the
 * debrief pre-warm ended up writing to a key nothing ever read: it hand-built
 * "debrief:<id>:<voice>" while the routes had moved to hashing the script.
 * Same code path, or no warming at all.
 *
 *   POST /api/admin/radio-audio/warm            # the default voice
 *   POST /api/admin/radio-audio/warm?voice=xyz  # one specific voice
 */
export async function POST(request: Request) {
  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 501 });
  }

  const requested = new URL(request.url).searchParams.get("voice");
  const voice = requested && isValidTtsVoice(requested) ? requested : DEFAULT_TTS_VOICE;

  let warmed = 0;
  let alreadyCached = 0;
  const failed: string[] = [];

  for (const scenario of RADIO_PRACTICE_SCENARIOS) {
    const key = audioCacheKey(`radio-practice:${scenario.id}`, voice, scenario.atcCall);

    // Skip what is already there. Re-running after adding one scenario should
    // cost one synthesis, not eighteen.
    if (await getCachedAudio(key)) {
      alreadyCached++;
      continue;
    }

    try {
      const audio = await synthesizeSpeech(toPilotSpeak(scenario.atcCall), apiKey, voice);
      await setCachedAudio(key, audio);
      warmed++;
    } catch (err) {
      // One bad scenario should not stop the other seventeen from warming.
      console.error(`[radio-audio-warm] ${scenario.id} failed:`, err);
      failed.push(scenario.id);
    }
  }

  return NextResponse.json({
    voice,
    total: RADIO_PRACTICE_SCENARIOS.length,
    warmed,
    alreadyCached,
    failed,
  });
}
