import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";

interface AssignBody {
  scenarioId: string;
  /** Required for a CFI/admin assigning to a roster student; ignored (self) for a solo student assigning their own practice. */
  studentId?: string;
}

/**
 * Assigns a radio-practice scenario (see lib/radio-practice-scenarios.ts)
 * to a student. Two paths: a CFI/admin assigning to one of their own
 * roster students, or a solo student (individual org, no CFI on the
 * roster) self-assigning -- same "individual org gets a self-serve path"
 * precedent as app/api/student/invite-cfi.
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
  } else if (viewer.role === "student" && viewer.organization.kind === "individual") {
    studentId = viewer.user.id;
    assignedBy = null;
  } else {
    return NextResponse.json({ error: "Ask your CFI to assign practice." }, { status: 403 });
  }

  const assignment = await repo.createRadioPracticeAssignment({
    organizationId: viewer.organization.id,
    studentId,
    assignedBy,
    scenarioId: scenario.id,
  });

  return NextResponse.json({ assignment });
}
