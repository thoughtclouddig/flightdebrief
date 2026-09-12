import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { curatedTrainingGuidance } from "@/lib/topics";
import { evaluateVectorAnswer, type VectorCoachEvaluation } from "@/lib/ai/vector-coach";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";
import { resolveVectorStrategy } from "@/lib/student/vector-coaching";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

interface EvaluateBody {
  answer?: string;
}

/**
 * Evaluates one answer inside Vector's bounded diagnostic Q&A for a single
 * unit (/train/vector/[itemId]) -- reached only when
 * lib/student/vector-coaching.ts's resolveVectorStrategy decided "check"
 * (no mechanism was known, and no performance activity exists for this
 * skill). Authenticated via authorize(), and the item itself is looked up
 * through resolveOwnedTrainingItem -- ownership-scoped at the query (a
 * JOIN against flights.student_id), never trusted from the URL alone.
 * Skill, evidence and grounding are all re-derived here server-side from
 * that exact item; the client supplies only the free-text answer.
 *
 * This answer becomes real activity evidence for round 2 of
 * resolveVectorStrategy -- the next move (Chair Fly, when a solid answer
 * legitimately re-opens it, or an honest transfer objective) is decided
 * from that evidence, never from matchedConceptCount as a universal
 * modality selector and never from the skill alone.
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
  const resolved = evaluation ?? fallback;

  const brief = await computeNextLessonBrief(repo, viewer.user.id);
  const cfiName = resolveCfiFirstName(brief.lastInstructor) ?? "your instructor";

  const strategy = resolveVectorStrategy({
    skill,
    mechanism: null,
    activityEvidence: {
      kind: "check",
      matchedConceptCount: resolved.matchedConcepts.length,
      expectedConceptCount: guidance.checkQuestion.expectedConcepts.length,
      takeaway: resolved.takeaway,
    },
    cfiName,
    fallbackEvidenceText: item.description,
  });

  return NextResponse.json({ evaluation: resolved, citation: guidance.citation, strategy });
}
