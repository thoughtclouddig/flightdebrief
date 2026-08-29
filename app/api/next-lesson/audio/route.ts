import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";
import { buildNextLessonNarration } from "@/lib/next-lesson-narration";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { getCachedAudio, setCachedAudio, audioCacheKey, NARRATION_AUDIO_HEADERS } from "@/lib/audio-cache";
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

  const [debrief, trainingItems] = await Promise.all([
    repo.getDebriefByFlight(lastDebriefed.id),
    repo.listTrainingItems(),
  ]);
  const itemsForFlight = trainingItems.filter((t) => t.flightId === lastDebriefed.id && !t.done);

  const script = buildNextLessonNarration({
    studentFirstName: viewer.user.name.split(" ")[0],
    instructorFirstName: resolveCfiFirstName(lastDebriefed.instructor),
    flightDate: lastDebriefed.flightDate,
    whatWeDid: debrief?.structuredResult.whatWeDid ?? [],
    keepWorkingOn: itemsForFlight.filter((t) => t.category === "keep_working_on").map((t) => t.description),
    beforeToday: itemsForFlight.filter((t) => t.category === "before_next_flight").map((t) => t.description),
    focus: debrief?.structuredResult.nextLessonFocus ?? [],
  });

  // Looked up after the script exists, so the key can include it: a change to
  // the narration is then a miss rather than something someone has to
  // remember to invalidate.
  const cacheKey = audioCacheKey(`next-lesson:${lastDebriefed.id}`, voice, script);
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), { headers: NARRATION_AUDIO_HEADERS });
  }

  let audio;
  try {
    audio = await synthesizeSpeech(toPilotSpeak(script), apiKey, voice);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[next-lesson-audio] synthesis failed:", detail);
    return NextResponse.json({ error: "Failed to generate audio.", detail }, { status: 502 });
  }

  setCachedAudio(cacheKey, audio);
  return new NextResponse(new Uint8Array(audio), { headers: NARRATION_AUDIO_HEADERS });
}
