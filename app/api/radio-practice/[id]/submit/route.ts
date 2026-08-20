import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { scoreRadioTranscript } from "@/lib/radio-practice-scoring";

interface SubmitBody {
  transcript: string;
}

/** Student submits a recorded/transcribed readback; scored deterministically (see lib/radio-practice-scoring.ts), then the assignment is marked complete. */
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
  if (assignment.status === "completed") {
    return NextResponse.json({ error: "This practice was already submitted." }, { status: 409 });
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
