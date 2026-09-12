import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { curatedTrainingGuidance } from "@/lib/topics";
import { evaluateVectorAnswer, type VectorCoachEvaluation } from "@/lib/ai/vector-coach";
import { evidenceForSkill } from "@/lib/student/vector-coaching";

interface EvaluateBody {
  answer?: string;
}

/**
 * Evaluates one answer inside Vector's bounded training-session interaction
 * (/train/vector/[skill]). Authenticated -- the signed-in student only, via
 * authorize() -- and everything the model is grounded in is derived here,
 * server-side, from this student's own real training signals and lib/
 * topics.ts's reviewed content. The client sends only the free-text answer;
 * it cannot supply its own "expected concepts" or evidence, so a tampered
 * request can't smuggle ungrounded material into the evaluator.
 *
 * Mirrors app/api/radio-practice/[id]/submit/route.ts's shape: judge first,
 * with a deterministic, still-honest fallback (the reviewed explanation
 * itself, never invented) when there's no API key or the call fails.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/train/vector/[skill]/evaluate">) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const { skill } = await params;
  const guidance = curatedTrainingGuidance(skill);
  if (!guidance?.checkQuestion) {
    return NextResponse.json({ error: "No grounded question available for this skill." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as EvaluateBody;
  const answer = typeof body.answer === "string" ? body.answer : "";
  if (!answer.trim()) {
    return NextResponse.json({ error: "Answer required." }, { status: 400 });
  }

  const repo = getRepository();
  const signals = await repo.listTrainingSignals({ studentId: viewer.user.id });
  const evidence = evidenceForSkill(signals, skill as Parameters<typeof evidenceForSkill>[1]);

  let evaluation: VectorCoachEvaluation | null = null;
  try {
    evaluation = await evaluateVectorAnswer({
      skillLabel: guidance.topic,
      question: guidance.checkQuestion.prompt,
      expectedConcepts: guidance.checkQuestion.expectedConcepts,
      explanation: guidance.checkQuestion.explanation,
      studentEvidence: evidence?.text ?? null,
      answer,
    });
  } catch (err) {
    console.error("[vector-coach] evaluation failed, falling back:", err);
  }

  // The reviewed explanation itself, never an invented substitute -- the
  // same honesty rule every curated field in lib/topics.ts already follows.
  const fallback: VectorCoachEvaluation = {
    matchedConcepts: [],
    feedback: guidance.checkQuestion.explanation,
    takeaway: guidance.checkQuestion.explanation,
  };

  return NextResponse.json({ evaluation: evaluation ?? fallback, citation: guidance.citation });
}
