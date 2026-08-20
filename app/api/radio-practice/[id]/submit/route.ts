import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { scoreRadioTranscript } from "@/lib/radio-practice-scoring";

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

  const score = scoreRadioTranscript(scenario, transcript);
  const updated = await repo.completeRadioPracticeAssignment(id, {
    transcript,
    correct: score.correct,
    matchedElements: score.elements,
  });

  return NextResponse.json({ assignment: updated, modelReadback: scenario.modelReadback });
}
