import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface SetDoneBody {
  done: boolean;
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/students/[id]/notes/[noteId]">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id, noteId } = await params;
  const body = (await request.json()) as SetDoneBody;
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ error: "Missing done" }, { status: 400 });
  }

  const repo = getRepository();
  const student = await repo.getUser(id);
  if (!student) return recordNotFound();
  const memberships = await repo.listMembershipsForUser(student.id);
  if (!memberships.some((m) => m.organizationId === auth.viewer.organization.id)) {
    return recordNotFound();
  }

  const note = (await repo.listStudentNotes({ studentId: id })).find((n) => n.id === noteId);
  if (!note) return recordNotFound();

  await repo.setStudentNoteDone(noteId, body.done);

  return NextResponse.json({ ok: true });
}
