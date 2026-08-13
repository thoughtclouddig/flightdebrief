import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { buildDebriefNarration } from "@/lib/debrief-narration";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { getCachedAudio, setCachedAudio } from "@/lib/audio-cache";
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

  const cacheKey = `debrief:${id}:${voice}`;
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), { headers: { "Content-Type": "audio/mpeg" } });
  }

  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) {
    return NextResponse.json({ error: "No debrief for this flight." }, { status: 404 });
  }

  const script = buildDebriefNarration({
    whatWeDid: debrief.structuredResult.whatWeDid,
    wentWell: debrief.structuredResult.wentWell,
    needsWork: debrief.structuredResult.needsWork,
    instructorGuidance: debrief.structuredResult.instructorGuidance,
    actionItems: debrief.structuredResult.actionItems,
  });

  const audio = await synthesizeSpeech(script, apiKey, voice);
  if (!audio) {
    return NextResponse.json({ error: "Failed to generate audio." }, { status: 502 });
  }

  setCachedAudio(cacheKey, audio);
  return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg" } });
}
