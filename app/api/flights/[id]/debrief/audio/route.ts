import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { buildDebriefNarration } from "@/lib/debrief-narration";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { getCachedAudio, setCachedAudio, audioCacheKey, NARRATION_AUDIO_HEADERS } from "@/lib/audio-cache";
import { DEFAULT_TTS_VOICE, isValidTtsVoice } from "@/lib/tts-voices";

/** Server-side TTS for a completed debrief -- see lib/debrief-narration.ts for the script. */
export async function GET(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/audio">) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 501 });
  }

  const { id } = await params;
  const requestedVoice = new URL(request.url).searchParams.get("voice");
  const voice = requestedVoice && isValidTtsVoice(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;

  // "private" (never shared/CDN cache -- this route is per-user access-controlled
  // via canAccessRecord below, so a shared cache could serve one user's audio to
  // another without ever re-checking authorization) but "immutable" -- a given
  // (flight, voice) never changes once generated, so the browser never needs to
  // re-fetch it on revisit.

  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) {
    return NextResponse.json({ error: "No debrief for this flight." }, { status: 404 });
  }

  const student = await repo.getUser(flight.userId);

  const script = buildDebriefNarration({
    studentFirstName: student?.name.split(" ")[0] ?? "there",
    instructorFirstName: resolveCfiFirstName(flight.instructor),
    narrativeRecap: debrief.structuredResult.narrativeRecap,
    whatWeDid: debrief.structuredResult.whatWeDid,
    wentWell: debrief.structuredResult.wentWell,
    needsWork: debrief.structuredResult.needsWork,
    instructorGuidance: debrief.structuredResult.instructorGuidance,
    actionItems: debrief.structuredResult.actionItems,
    studyReferences: debrief.structuredResult.studyReferences,
  });

  // After the script, so the key describes the audio rather than the debrief
  // -- a narration change invalidates itself.
  const cacheKey = audioCacheKey(`debrief:${id}`, voice, script);
  const cached = await getCachedAudio(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), { headers: NARRATION_AUDIO_HEADERS });
  }

  let audio;
  try {
    audio = await synthesizeSpeech(toPilotSpeak(script), apiKey, voice);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[debrief-audio] synthesis failed:", detail);
    return NextResponse.json({ error: "Failed to generate audio.", detail }, { status: 502 });
  }

  await setCachedAudio(cacheKey, audio);
  return new NextResponse(new Uint8Array(audio), { headers: NARRATION_AUDIO_HEADERS });
}
