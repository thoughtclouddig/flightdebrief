import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { curatedTrainingGuidance } from "@/lib/topics";
import { evaluateVectorAnswer, type VectorCoachEvaluation } from "@/lib/ai/vector-coach";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";

interface EvaluateBody {
  answer?: string;
}

/**
 * Evaluates one answer inside Vector's bounded training-session interaction
 * for a single unit (/train/vector/[itemId]). Authenticated via
 * authorize(), and the item itself is looked up through
 * resolveOwnedTrainingItem -- ownership-scoped at the query (a JOIN against
 * flights.student_id), never trusted from the URL alone. Skill, evidence
 * and grounding are all re-derived here server-side from that exact item;
 * the client supplies only the free-text answer.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/train/vector/[itemId]/evaluate">) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const { itemId } = await params;
  const repo = getRepository();
  const owned = await resolveOwnedTrainingItem(repo, viewer.user.id, itemId);
  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const { item, skill } = owned;

  const guidance = curatedTrainingGuidance(skill);
  if (!guidance?.checkQuestion) {
    return NextResponse.json({ error: "No grounded question available for this skill." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as EvaluateBody;
  const answer = typeof body.answer === "string" ? body.answer : "";
  if (!answer.trim()) {
    return NextResponse.json({ error: "Answer required." }, { status: 400 });
  }

  let evaluation: VectorCoachEvaluation | null = null;
  try {
    evaluation = await evaluateVectorAnswer({
      skillLabel: guidance.topic,
      question: guidance.checkQuestion.prompt,
      expectedConcepts: guidance.checkQuestion.expectedConcepts,
      explanation: guidance.checkQuestion.explanation,
      studentEvidence: item.description,
      answer,
    });
  } catch (err) {
    console.error("[vector-coach] evaluation failed, falling back:", err);
  }

  // The reviewed explanation itself, never an invented substitute.
  const fallback: VectorCoachEvaluation = {
    matchedConcepts: [],
    feedback: guidance.checkQuestion.explanation,
    takeaway: guidance.checkQuestion.explanation,
  };

  return NextResponse.json({ evaluation: evaluation ?? fallback, citation: guidance.citation });
}
