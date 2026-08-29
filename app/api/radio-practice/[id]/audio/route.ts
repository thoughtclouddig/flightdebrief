import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { getCachedAudio, setCachedAudio, audioCacheKey, NARRATION_AUDIO_HEADERS } from "@/lib/audio-cache";
import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

/**
 * TTS for a scenario's ATC call. Cached by scenario (not by assignment) --
 * the call text is fixed content shared across every assignment of the
 * same scenario, so synthesizing it once per scenario/voice is enough.
 * The client applies the actual "sounds like a radio" effect (bandpass +
 * light static) via Web Audio at playback time (see components/radio-effect.ts)
 * rather than baking it into the cached audio server-side.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/radio-practice/[id]/audio">) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 501 });
  }

  const { id } = await params;
  const repo = getRepository();
  const assignment = await repo.getRadioPracticeAssignment(id);
  const isOwner = assignment?.studentId === viewer.user.id;
  const isOrgStaff =
    (viewer.role === "instructor" || viewer.role === "admin") && assignment?.organizationId === viewer.organization.id;
  if (!assignment || !(isOwner || isOrgStaff)) {
    return recordNotFound();
  }

  const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.id === assignment.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario content is no longer available." }, { status: 404 });
  }

  const requestedVoice = new URL(request.url).searchParams.get("voice");
  const voice = requestedVoice && isValidTtsVoice(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;

  // "private" (the URL is per-assignment and access-controlled above, so there's
  // no shared-cache benefit to forgo) but "immutable" -- a given (scenario, voice)
  // never changes, so the browser never needs to re-fetch it on revisit.

  // Keyed on the call text, not the scenario id. Scenario wording gets
  // corrected -- the ATIS call was rewritten after it asked students to read
  // an altimeter back to Ground -- and an id-keyed cache would have gone on
  // playing the wrong one.
  const cacheKey = audioCacheKey(`radio-practice:${scenario.id}`, voice, scenario.atcCall);
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), { headers: NARRATION_AUDIO_HEADERS });
  }

  let audio;
  try {
    audio = await synthesizeSpeech(toPilotSpeak(scenario.atcCall), apiKey, voice);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[radio-practice-audio] synthesis failed:", detail);
    return NextResponse.json({ error: "Failed to generate audio.", detail }, { status: 502 });
  }

  setCachedAudio(cacheKey, audio);
  return new NextResponse(new Uint8Array(audio), { headers: NARRATION_AUDIO_HEADERS });
}
