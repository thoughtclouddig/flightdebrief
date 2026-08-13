import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { buildDebriefNarration } from "@/lib/debrief-narration";
import { synthesizeSpeech } from "@/lib/deepgram-tts";

/** Server-side TTS for a completed debrief -- see lib/debrief-narration.ts for the script. */
export async function GET(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/audio">) {
  const auth = await authorize();
  if (auth.response) return auth.response;

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

  const voice = new URL(request.url).searchParams.get("voice");
  const stream = await synthesizeSpeech(script, apiKey, voice);
  if (!stream) {
    return NextResponse.json({ error: "Failed to generate audio." }, { status: 502 });
  }

  return new NextResponse(stream, { headers: { "Content-Type": "audio/mpeg" } });
}
