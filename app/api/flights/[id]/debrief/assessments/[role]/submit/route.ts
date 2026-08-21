import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { assertAssessmentRole } from "@/lib/auth/assessment-access";
import { getRepository } from "@/lib/data";
import { generateDebriefCards } from "@/lib/debrief-cards/generate";
import { computeRecentSkillHistory } from "@/lib/debrief-cards/history";
import { notesToCardDrafts } from "@/lib/debrief-cards/notes-to-cards";
import type { AssessmentRole } from "@/lib/types";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

interface SubmitBody {
  overallReflection?: string | null;
}

const OTHER_ROLE: Record<AssessmentRole, AssessmentRole> = { student: "instructor", instructor: "student" };

/**
 * Submits the caller's own independent assessment. The CFI must submit
 * first -- a student's submission is rejected until the instructor's is in
 * (see the check below). Card generation triggers once both are submitted.
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

  // CFI goes first, always -- the two-assessments-in-any-order design was
  // the source of real confusion in practice (nobody knew whose turn it
  // was). The real boundary is here, not the page-level gate or the
  // resolver's redirect -- either of those alone can be bypassed by hitting
  // the self-assessment URL directly.
  if (role === "student") {
    const instructorAssessment = await repo.getAssessment(id, "instructor");
    if (instructorAssessment?.status !== "submitted") {
      return NextResponse.json(
        { error: "Your instructor needs to submit their assessment first." },
        { status: 400 },
      );
    }
  }

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

  // Open CFI notes for this student become guaranteed extra cards -- see
  // notesToCardDrafts' doc comment. Marked done here (when they're queued
  // into this debrief), not after the recording -- reliably tracking
  // whether a specific card actually got discussed vs. skipped would need a
  // note<->card link the schema doesn't have; being queued is a close enough
  // signal, and a CFI can always re-add a note if it truly wasn't covered.
  const openNotes = (await repo.listStudentNotes({ studentId: flight.userId })).filter((n) => !n.done);
  const noteResults = notesToCardDrafts(openNotes, drafts.length);
  await Promise.all(noteResults.map((r) => repo.setStudentNoteDone(r.noteId, true)));

  const allDrafts = [...drafts, ...noteResults.map((r) => r.draft)];
  await repo.createCards(allDrafts.map((draft) => ({ ...draft, flightId })));
}
