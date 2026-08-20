import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

/** Removes an assigned/completed practice item from a student's list. CFI/admin only, scoped to their own org. */
export async function DELETE(request: Request, { params }: RouteContext<"/api/radio-practice/[id]">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const { id } = await params;
  const repo = getRepository();
  const assignment = await repo.getRadioPracticeAssignment(id);
  if (!assignment || assignment.organizationId !== viewer.organization.id) {
    return recordNotFound();
  }

  await repo.deleteRadioPracticeAssignment(id);
  return NextResponse.json({ ok: true });
}
