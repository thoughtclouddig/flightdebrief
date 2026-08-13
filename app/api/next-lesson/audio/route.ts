import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildNextLessonNarration } from "@/lib/next-lesson-narration";

const DEFAULT_MODEL = "aura-asteria-en";

/** Server-side TTS for the Next-Lesson Brief -- see lib/next-lesson-narration.ts for the script. */
export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 501 });
  }

  const repo = getRepository();
  const viewer = await getViewer();
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
    flightDate: lastDebriefed.flightDate,
    whatWeDid: debrief?.structuredResult.whatWeDid ?? [],
    keepWorkingOn: itemsForFlight.filter((t) => t.category === "keep_working_on").map((t) => t.description),
    beforeToday: itemsForFlight.filter((t) => t.category === "before_next_flight").map((t) => t.description),
    focus: debrief?.structuredResult.nextLessonFocus ?? [],
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
