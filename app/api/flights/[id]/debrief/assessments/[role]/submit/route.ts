import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { assertAssessmentRole } from "@/lib/auth/assessment-access";
import { getRepository } from "@/lib/data";
import { generateDebriefCards } from "@/lib/debrief-cards/generate";
import { computeRecentSkillHistory } from "@/lib/debrief-cards/history";
import type { AssessmentRole } from "@/lib/types";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

interface SubmitBody {
  overallReflection?: string | null;
}

const OTHER_ROLE: Record<AssessmentRole, AssessmentRole> = { student: "instructor", instructor: "student" };

/**
 * Submits the caller's own independent assessment. Card generation is
 * triggered once BOTH assessments are submitted -- not hardcoded to whichever
 * role submits second, so it works regardless of which order the CFI and
 * student actually finish in.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/flights/[id]/debrief/assessments/[role]/submit">,
) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { id, role: roleParam } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const roleCheck = assertAssessmentRole(auth.viewer, flight, roleParam);
  if (roleCheck.response) return roleCheck.response;
  const role = roleCheck.role;

  const body = (await request.json().catch(() => ({}))) as SubmitBody;
  const assessment = await repo.getOrCreateAssessment(id, role, auth.viewer.user.id);
  await repo.submitAssessment(assessment.id, body.overallReflection ?? null);

  const otherAssessment = await repo.getAssessment(id, OTHER_ROLE[role]);
  if (otherAssessment?.status === "submitted") {
    const existingCards = await repo.listCards(id);
    if (existingCards.length === 0) {
      await generateAndPersistCards(id, role === "student" ? assessment.id : otherAssessment.id, role === "instructor" ? assessment.id : otherAssessment.id);
    }
  }

  return NextResponse.json({ ok: true });
}

async function generateAndPersistCards(flightId: string, studentAssessmentId: string, instructorAssessmentId: string) {
  const repo = getRepository();
  const flight = await repo.getFlight(flightId);
  if (!flight) return;

  const [flightTasks, studentRatingRows, instructorRatingRows, cardDefinitions, recentSkillHistory] = await Promise.all([
    repo.listFlightTasks(flightId),
    repo.listAssessmentRatings(studentAssessmentId),
    repo.listAssessmentRatings(instructorAssessmentId),
    repo.listCardDefinitions(flight.organizationId ?? undefined),
    computeRecentSkillHistory(repo, flight.userId, flightId, flight.flightDate),
  ]);

  const taskIdToCode = new Map(flightTasks.map((t) => [t.id, t.taskCode]));
  const toCodeMap = (rows: { flightTaskId: string; performanceLevel: PerformanceLevelCode }[]) => {
    const map = new Map<string, PerformanceLevelCode>();
    for (const row of rows) {
      const code = taskIdToCode.get(row.flightTaskId);
      if (code) map.set(code, row.performanceLevel);
    }
    return map;
  };

  const drafts = generateDebriefCards({
    flightTasks,
    studentRatings: toCodeMap(studentRatingRows),
    instructorRatings: toCodeMap(instructorRatingRows),
    cardDefinitions,
    recentSkillHistory,
    lessonObjectiveTaskCode: null,
  });

  await repo.createCards(drafts.map((draft) => ({ ...draft, flightId })));
}
