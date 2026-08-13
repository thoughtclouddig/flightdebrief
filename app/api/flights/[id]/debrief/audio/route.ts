import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { buildDebriefNarration } from "@/lib/debrief-narration";

const DEFAULT_MODEL = "aura-asteria-en";

/** Server-side TTS for a completed debrief -- see lib/debrief-narration.ts for the script. */
export async function GET(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/audio">) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 501 });
  }

  const { id } = await params;
  const repo = getRepository();
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

  const deepgram = createClient(apiKey);
  const ttsResponse = await deepgram.speak.request(
    { text: script },
    { model: process.env.DEEPGRAM_TTS_MODEL || DEFAULT_MODEL, encoding: "mp3" },
  );
  const stream = await ttsResponse.getStream();
  if (!stream) {
    return NextResponse.json({ error: "Failed to generate audio." }, { status: 502 });
  }

  return new NextResponse(stream, { headers: { "Content-Type": "audio/mpeg" } });
}
