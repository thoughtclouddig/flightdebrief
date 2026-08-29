import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { scoreRadioTranscript } from "@/lib/radio-practice-scoring";
import { judgeRadioTranscript } from "@/lib/ai/radio-judge";

interface SubmitBody {
  transcript: string;
}

/**
 * Student submits a recorded/transcribed readback; scored deterministically
 * (see lib/radio-practice-scoring.ts), then the assignment is marked
 * complete. Resubmitting an already-completed assignment is allowed --
 * overwrites the previous transcript/score rather than rejecting -- so a
 * student can retry after a mistake (see components/radio-practice-session.tsx's
 * "Try Again"). This only tracks the latest attempt, not a history of
 * every retry.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/radio-practice/[id]/submit">) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const { id } = await params;
  const repo = getRepository();
  const assignment = await repo.getRadioPracticeAssignment(id);
  if (!assignment || assignment.studentId !== viewer.user.id) {
    return recordNotFound();
  }

  const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.id === assignment.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario content is no longer available." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as SubmitBody;
  const transcript = typeof body.transcript === "string" ? body.transcript : "";

  // Judged by an instructor-shaped grader first, with keyword scoring as the
  // fallback. Keyword matching fails a correct transmission phrased in a
  // different order -- "three alpha bravo, taxi two seven via alpha" contains
  // every required element and misses a substring check written around the
  // model's word order -- and telling a student they were wrong when they
  // were right is the worst thing this page can do.
  let coaching: string | null = null;
  let score = null as Awaited<ReturnType<typeof judgeRadioTranscript>> | null;
  try {
    score = await judgeRadioTranscript(scenario, transcript);
    if (score?.scenarioConcern) {
      // Never shown to the student: it's a note about the exercise, not their
      // flying. The bank is hand-written, and a scenario that asks for
      // something no pilot would say has already shipped once.
      console.warn(`[radio-practice] ${scenario.id}: ${score.scenarioConcern}`);
    }
    coaching = score?.coaching ?? null;
  } catch (err) {
    console.error("[radio-practice] judge failed, falling back to keyword scoring:", err);
  }

  const result = score ?? scoreRadioTranscript(scenario, transcript);

  const updated = await repo.completeRadioPracticeAssignment(id, {
    transcript,
    correct: result.correct,
    matchedElements: result.elements,
  });

  return NextResponse.json({ assignment: updated, modelReadback: scenario.modelReadback, coaching });
}
