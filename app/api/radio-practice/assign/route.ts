import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";

interface AssignBody {
  scenarioId: string;
  /** Required for a CFI/admin assigning to a roster student; ignored (self) for a student starting their own practice. */
  studentId?: string;
  /** Set when Vector is launching this as the training unit's diagnostic/rehearsal activity -- re-verified as this exact student's own item before being trusted, never persisted merely because the client sent it. */
  trainingItemId?: string;
}

/**
 * Assigns a radio-practice scenario (see lib/radio-practice-scenarios.ts)
 * to a student. Two paths: a CFI/admin assigning to one of their own
 * roster students, or a student starting their own practice (any org kind,
 * CFI or no CFI) -- Radio Practice is a student capability; a CFI's
 * assignment adds provenance/priority (assignedBy set), it never gates
 * whether the student can reach it at all. The student-facing UI never
 * calls this "assigning yourself" -- that framing is a backend detail of
 * this route, not the student's mental model (see
 * components/student/radio-practice-picker.tsx).
 */
export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const body = (await request.json().catch(() => ({}))) as AssignBody;
  const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.id === body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
  }

  const repo = getRepository();

  let studentId: string;
  let assignedBy: string | null;

  if (viewer.role === "instructor" || viewer.role === "admin") {
    if (!body.studentId) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
    }
    const roster = await repo.listMembers(viewer.organization.id, "student");
    if (!roster.some((m) => m.userId === body.studentId)) {
      return NextResponse.json({ error: "That student is not on your roster" }, { status: 403 });
    }
    studentId = body.studentId;
    assignedBy = viewer.user.id;
  } else if (viewer.role === "student") {
    studentId = viewer.user.id;
    assignedBy = null;
  } else {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Re-verified here, never trusted from the client alone: only an id that
  // resolves to this exact student's own owned training unit gets linked.
  // A bogus or someone-else's id just silently doesn't link, rather than
  // erroring the whole practice attempt over it.
  const trainingItemId = body.trainingItemId
    ? ((await resolveOwnedTrainingItem(repo, studentId, body.trainingItemId)) ? body.trainingItemId : null)
    : null;

  const assignment = await repo.createRadioPracticeAssignment({
    organizationId: viewer.organization.id,
    studentId,
    assignedBy,
    scenarioId: scenario.id,
    trainingItemId,
  });

  return NextResponse.json({ assignment });
}
