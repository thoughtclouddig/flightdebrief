import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

/**
 * Lists radio-practice assignments. Students always get their own. A CFI/
 * admin may pass ?studentId= to see one of their own roster student's
 * assignments (e.g. for the assign-practice UI to show what's already
 * assigned) -- verified against their roster, same guard as the assign route.
 */
export async function GET(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const requestedStudentId = new URL(request.url).searchParams.get("studentId");
  const repo = getRepository();

  let studentId: string;
  if (requestedStudentId && requestedStudentId !== viewer.user.id) {
    if (viewer.role !== "instructor" && viewer.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const roster = await repo.listMembers(viewer.organization.id, "student");
    if (!roster.some((m) => m.userId === requestedStudentId)) {
      return NextResponse.json({ error: "That student is not on your roster" }, { status: 403 });
    }
    studentId = requestedStudentId;
  } else {
    studentId = viewer.user.id;
  }

  const assignments = await repo.listRadioPracticeAssignments(studentId);
  return NextResponse.json({ assignments });
}
