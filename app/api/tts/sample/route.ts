import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getCachedAudio, setCachedAudio } from "@/lib/audio-cache";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

/**
 * A few seconds of each voice, so the Profile picker isn't asking people to
 * choose one blind. Deliberately a line from an actual debrief rather than
 * "the quick brown fox" -- the point is to hear how this voice reads *your*
 * content, at the same speed and expressivity the real narration uses.
 *
 * Short and identical for every voice, so it's one sub-2000-char request and
 * caches on first play. Auth-gated like every other TTS route: this spends
 * Deepgram credits.
 */
const SAMPLE_LINE =
  "Nice work today. Early on you were chasing the airspeed a little, but by the last two landings you were flying the numbers instead of reacting to them.";

export async function GET(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const requested = new URL(request.url).searchParams.get("voice");
  const voice = requested && isValidTtsVoice(requested) ? requested : DEFAULT_TTS_VOICE;

  // Content is fixed, so the voice alone identifies the audio -- one render
  // per voice for the whole process, shared across every user.
  const cacheKey = `voice-sample:${voice}`;
  const cached = await getCachedAudio(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voice samples need a Deepgram API key." }, { status: 503 });
  }

  try {
    const audio = await synthesizeSpeech(SAMPLE_LINE, apiKey, voice);
    await setCachedAudio(cacheKey, audio);
    return new NextResponse(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("[tts-sample] failed:", detail);
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
