import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";
import { buildNextLessonNarration } from "@/lib/next-lesson-narration";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { getCachedAudio, setCachedAudio } from "@/lib/audio-cache";
import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

/** Server-side TTS for the Next-Lesson Brief -- see lib/next-lesson-narration.ts for the script. */
export async function GET(request: Request) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 501 });
  }

  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const requestedVoice = new URL(request.url).searchParams.get("voice");
  const voice = requestedVoice && isValidTtsVoice(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;

  const repo = getRepository();
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const lastDebriefed = flights
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0];
  if (!lastDebriefed) {
    return NextResponse.json({ error: "No debriefed flight yet." }, { status: 404 });
  }

  // "private" (never shared/CDN cache -- this route is per-user access-controlled,
  // so a shared cache could serve one user's audio to another) but "immutable" --
  // a given (flight, voice) never changes once generated, so the browser never
  // needs to re-fetch it on revisit.
  const AUDIO_CACHE_HEADERS = { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=604800, immutable" };

  const cacheKey = `next-lesson:${lastDebriefed.id}:${voice}`;
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), { headers: AUDIO_CACHE_HEADERS });
  }

  const [debrief, trainingItems] = await Promise.all([
    repo.getDebriefByFlight(lastDebriefed.id),
    repo.listTrainingItems(),
  ]);
  const itemsForFlight = trainingItems.filter((t) => t.flightId === lastDebriefed.id && !t.done);

  const script = buildNextLessonNarration({
    studentFirstName: viewer.user.name.split(" ")[0],
    flightDate: lastDebriefed.flightDate,
    whatWeDid: debrief?.structuredResult.whatWeDid ?? [],
    keepWorkingOn: itemsForFlight.filter((t) => t.category === "keep_working_on").map((t) => t.description),
    beforeToday: itemsForFlight.filter((t) => t.category === "before_next_flight").map((t) => t.description),
    focus: debrief?.structuredResult.nextLessonFocus ?? [],
  });

  let audio;
  try {
    audio = await synthesizeSpeech(toPilotSpeak(script), apiKey, voice);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[next-lesson-audio] synthesis failed:", detail);
    return NextResponse.json({ error: "Failed to generate audio.", detail }, { status: 502 });
  }

  setCachedAudio(cacheKey, audio);
  return new NextResponse(new Uint8Array(audio), { headers: AUDIO_CACHE_HEADERS });
}
