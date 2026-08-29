import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { analyzeDebrief } from "@/lib/ai";
import { getRepository } from "@/lib/data";
import { isBillingBlocked } from "@/lib/billing-gate";
import { classifyTrainingSignals } from "@/lib/taxonomy";
import { evaluateAndAwardMilestones } from "@/lib/milestones";
import { autoResolveActionItems } from "@/lib/action-items-autoresolve";
import { buildTranscriptSegments, type CardBoundary } from "@/lib/debrief-cards/segments";
import { computeAssessmentDifferences } from "@/lib/debrief-cards/differences";
import { buildDebriefNarration } from "@/lib/debrief-narration";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { setCachedAudio, audioCacheKey } from "@/lib/audio-cache";
import { DEFAULT_TTS_VOICE } from "@/lib/tts-voices";
import type { DebriefGuidanceMode, StructuredDebrief } from "@/lib/types";
import { buildDiarizedTurns } from "@/lib/transcription/diarized-turns";
import { filterTrainingItemDescriptions } from "@/lib/training-item-quality";
import type { TranscriptWord } from "@/lib/transcription/types";
import { DEMO_FLIGHT_ID } from "@/lib/demo/video-demo-data";
import { DEMO_CURATED_RESULT } from "@/lib/demo/video-demo-seed";

interface AnalyzeBody {
  flightId: string;
  /** Omit to resume a previously-saved pending transcript for this flight (see savePendingDebriefTranscript) instead of submitting a fresh recording. */
  transcript?: string;
  audioDurationSeconds?: number;
  /** Guided/Light mode only -- omitted defaults to "freeform" (today's behavior, unchanged). */
  guidanceMode?: DebriefGuidanceMode;
  recordingStartedAt?: string | null;
  recordingEndedAt?: string | null;
  words?: TranscriptWord[];
  cardBoundaries?: CardBoundary[];
}

export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const body = (await request.json()) as AnalyzeBody;
  if (!body.flightId) {
    return NextResponse.json({ error: "Missing flightId" }, { status: 400 });
  }

  const repo = getRepository();
  const flight = await repo.getFlight(body.flightId);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  // A fresh recording is saved as a pending transcript *before* the billing
  // check below -- if the org is blocked, the recording the student just
  // talked through is never discarded, only the AI analysis of it is
  // deferred. Resuming (no transcript in the body) reads that saved row
  // instead of requiring the student to re-record from scratch.
  let pending: Awaited<ReturnType<typeof repo.getPendingDebriefTranscript>>;
  if (body.transcript?.trim()) {
    pending = await repo.savePendingDebriefTranscript({
      flightId: flight.id,
      transcript: body.transcript,
      audioDurationSeconds: body.audioDurationSeconds ?? 0,
      guidanceMode: body.guidanceMode ?? "freeform",
      recordingStartedAt: body.recordingStartedAt ?? null,
      recordingEndedAt: body.recordingEndedAt ?? null,
      words: body.words ?? null,
      cardBoundaries: body.cardBoundaries ?? null,
    });
  } else {
    pending = await repo.getPendingDebriefTranscript(flight.id);
    if (!pending) {
      // A real recording session with nothing in the transcript almost always
      // means the wrong mic was selected, not a transient network hiccup --
      // give the CFI/student something actionable instead of a generic retry.
      const noAudioCaptured = typeof body.audioDurationSeconds === "number" && body.audioDurationSeconds > 3;
      return NextResponse.json(
        {
          error: noAudioCaptured ? "no_audio_detected" : "missing_transcript",
          message: noAudioCaptured
            ? "We didn't hear anything during that recording. Check that the right microphone is selected and try again."
            : "Missing transcript, and no saved recording to resume",
        },
        { status: 400 },
      );
    }
  }
  const guidanceMode = pending.guidanceMode;

  const organization = flight.organizationId ? await repo.getOrganization(flight.organizationId) : null;
  if (organization && (await isBillingBlocked(repo, organization))) {
    return NextResponse.json(
      { error: "billing_required", message: "You've used up your free debriefs. Subscribe to keep going." },
      { status: 402 },
    );
  }

  const previousActionItems = await getPreviousActionItems(flight.userId, flight.flightDate, flight.id);
  const assessmentDifferences =
    guidanceMode === "freeform" ? [] : await getAssessmentDifferences(flight.id);

  // Video Demo Mode's fixed flight: always return the curated result instead
  // of running the analyzer, so Scene 6 shows identical, camera-ready copy
  // on every take regardless of what actually got said on mic -- see
  // lib/demo/video-demo-data.ts's DEMO_CURATED_RESULT doc comment.
  const { structured, analyzedWith } =
    flight.id === DEMO_FLIGHT_ID
      ? { structured: DEMO_CURATED_RESULT, analyzedWith: "mock" as const }
      : await analyzeDebrief({
          transcript: pending.transcript,
          // Null unless diarization actually separated two or more voices --
          // see lib/transcription/diarized-turns.ts.
          diarizedTurns: pending.words?.length ? buildDiarizedTurns(pending.words) : null,
          flightMeta: {
            tailNumber: flight.aircraft.tailNumber,
            aircraftType: flight.aircraft.type,
            departureAirport: flight.departureAirport,
            arrivalAirport: flight.arrivalAirport,
            flightDate: flight.flightDate,
            durationMinutes: flight.durationMinutes,
            instructorName: flight.instructor?.name ?? null,
          },
          previousActionItems,
          assessmentDifferences,
        });

  const debrief = await repo.createDebrief({
    flightId: flight.id,
    transcript: pending.transcript,
    audioDurationSeconds: pending.audioDurationSeconds,
    structuredResult: structured,
    analyzedWith,
    guidanceMode,
    recordingStartedAt: pending.recordingStartedAt,
    recordingEndedAt: pending.recordingEndedAt,
  });
  await repo.deletePendingDebriefTranscript(flight.id);

  if (guidanceMode !== "freeform" && pending.words?.length && pending.cardBoundaries?.length) {
    const segments = buildTranscriptSegments(pending.words, pending.cardBoundaries);
    await repo.createTranscriptSegments(
      segments.map((s) => ({
        flightId: flight.id,
        debriefCardId: s.debriefCardId,
        startSeconds: s.startSeconds,
        endSeconds: s.endSeconds,
        text: s.text,
        speakerLabel: s.speakerLabel,
      })),
    );
  }

  // Guided/light mode holds off marking the flight complete here -- the CFI
  // still needs to walk through the generated debrief with the student and
  // hit "Finish" on /review (see app/api/flights/[id]/debrief/finish/route.ts)
  // before it's final. Freeform mode has no review step, so it keeps the old
  // immediate-complete behavior.
  if (guidanceMode === "freeform") {
    await repo.setFlightDebriefStatus(flight.id, "complete");
    await evaluateAndAwardMilestones(repo, flight.userId, flight.id);
  }

  // Before adding this debrief's own new items, check whether its wentWell
  // content resolves any still-open item from an earlier flight -- run here
  // (not after createTrainingItems below) specifically so it only considers
  // genuinely prior items, never this same debrief's freshly-created ones.
  await autoResolveActionItems(repo, flight.userId, structured.wentWell);

  // The prompt asks for specific, nameable skills and no narrative recaps,
  // but a prompt is a request, not a constraint -- and anything that slips
  // through is permanent on the student's list. See lib/training-item-quality.ts.
  await repo.createTrainingItems([
    ...filterTrainingItemDescriptions(structured.needsWork).map((description) => ({
      flightId: flight.id,
      debriefId: debrief.id,
      category: "keep_working_on" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
    })),
    ...filterTrainingItemDescriptions(structured.actionItems).map((description) => ({
      flightId: flight.id,
      debriefId: debrief.id,
      category: "before_next_flight" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
    })),
  ]);

  const signalDrafts = classifyTrainingSignals(structured);
  await repo.createTrainingSignals(
    signalDrafts.map((draft) => ({
      ...draft,
      organizationId: flight.organizationId,
      studentId: flight.userId,
      instructorId: flight.instructorId,
      aircraftId: flight.aircraftId,
      flightId: flight.id,
      debriefId: debrief.id,
      flightDate: flight.flightDate,
      dismissed: false,
    })),
  );

  void prewarmDebriefAudio(flight.id, flight.userId, resolveCfiFirstName(flight.instructor), structured);

  return NextResponse.json({ debrief });
}

/**
 * Fires off TTS synthesis for the default voice as soon as a debrief is
 * ready, instead of waiting for the first "Listen" click to trigger it --
 * the batch endpoint takes several seconds to render a full script (see
 * lib/deepgram-tts.ts), and by the time a student reaches the results page
 * this has often already finished, making that first click feel instant.
 * Deliberately not awaited (mustn't add latency to analyze itself) and never
 * throws -- a failed pre-warm just means the first click falls back to
 * generating on demand, same as before this existed.
 */
async function prewarmDebriefAudio(
  flightId: string,
  studentId: string,
  instructorFirstName: string | null,
  structured: StructuredDebrief,
): Promise<void> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) return;

  try {
    const student = await getRepository().getUser(studentId);
    // The narration, not the pilot-speak form: the route keys the cache on
    // this and synthesizes the converted text, so keying on the converted
    // text here would write somewhere the route never looks.
    const script = buildDebriefNarration({
        studentFirstName: student?.name.split(" ")[0] ?? "there",
        instructorFirstName,
        // Must match what GET /api/flights/[id]/debrief/audio builds, because
        // this writes to the same cache key that route reads first. Omitting
        // it here meant the pre-warm cached the templated bullet-by-bullet
        // readout, and the natural recap was never heard -- the cache hit
        // beat the route that actually passes it.
        narrativeRecap: structured.narrativeRecap,
        whatWeDid: structured.whatWeDid,
        wentWell: structured.wentWell,
        needsWork: structured.needsWork,
        instructorGuidance: structured.instructorGuidance,
        actionItems: structured.actionItems,
        studyReferences: structured.studyReferences,
    });

    const audio = await synthesizeSpeech(toPilotSpeak(script), apiKey, DEFAULT_TTS_VOICE);
    // Built with the same helper the route uses. Hand-writing the key here is
    // what broke this: the route moved to a script-hashed key and the
    // pre-warm kept writing the old shape, so it missed on every click and
    // silently did nothing but spend a Deepgram call.
    await setCachedAudio(audioCacheKey(`debrief:${flightId}`, DEFAULT_TTS_VOICE, script), audio);
  } catch (err) {
    console.error("[debrief-audio] pre-warm failed:", err instanceof Error ? err.message : err);
  }
}

async function getPreviousActionItems(studentId: string, currentFlightDate: string, currentFlightId: string) {
  const repo = getRepository();
  const flights = await repo.listFlights({ studentId });
  const priorCompleted = flights
    .filter((f) => f.id !== currentFlightId && f.debriefStatus === "complete" && f.flightDate <= currentFlightDate)
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0];
  if (!priorCompleted) return [];

  const items = await repo.listTrainingItems();
  return items
    .filter(
      (item) =>
        item.flightId === priorCompleted.id &&
        !item.done &&
        (item.category === "before_next_flight" || item.category === "keep_working_on"),
    )
    .map((item) => item.description);
}

/** Guided/Light mode only -- reads the two submitted independent assessments and computes disagreements deterministically (never asked of Claude). */
async function getAssessmentDifferences(flightId: string) {
  const repo = getRepository();
  const [flightTasks, studentAssessment, instructorAssessment] = await Promise.all([
    repo.listFlightTasks(flightId),
    repo.getAssessment(flightId, "student"),
    repo.getAssessment(flightId, "instructor"),
  ]);
  if (!studentAssessment || !instructorAssessment) return [];

  const [studentRatingRows, instructorRatingRows] = await Promise.all([
    repo.listAssessmentRatings(studentAssessment.id),
    repo.listAssessmentRatings(instructorAssessment.id),
  ]);

  const taskLabels = new Map(flightTasks.map((t) => [t.taskCode, t.label]));
  const taskIdToCode = new Map(flightTasks.map((t) => [t.id, t.taskCode]));
  const toCodeMap = (rows: typeof studentRatingRows) => {
    const map = new Map<string, (typeof rows)[number]["performanceLevel"]>();
    for (const row of rows) {
      const code = taskIdToCode.get(row.flightTaskId);
      if (code) map.set(code, row.performanceLevel);
    }
    return map;
  };

  return computeAssessmentDifferences(taskLabels, toCodeMap(studentRatingRows), toCodeMap(instructorRatingRows));
}
