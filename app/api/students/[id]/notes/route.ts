import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface CreateNoteBody {
  description: string;
}

async function authorizeForStudent(studentId: string) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return { response: auth.response } as const;
  const repo = getRepository();
  const student = await repo.getUser(studentId);
  if (!student) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  const memberships = await repo.listMembershipsForUser(student.id);
  if (!memberships.some((m) => m.organizationId === auth.viewer.organization.id)) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  }
  return { viewer: auth.viewer, student } as const;
}

/** CFI-authored standing notes about a student -- see db/schema.sql's student_notes doc comment. */
export async function GET(_request: Request, { params }: RouteContext<"/api/students/[id]/notes">) {
  const { id } = await params;
  const auth = await authorizeForStudent(id);
  if (auth.response) return auth.response;

  const notes = await getRepository().listStudentNotes({ studentId: id });
  return NextResponse.json({ notes });
}

export async function POST(request: Request, { params }: RouteContext<"/api/students/[id]/notes">) {
  const { id } = await params;
  const auth = await authorizeForStudent(id);
  if (auth.response) return auth.response;

  const body = (await request.json()) as CreateNoteBody;
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const note = await getRepository().createStudentNote({
    organizationId: auth.viewer.organization.id,
    studentId: id,
    authorUserId: auth.viewer.user.id,
    description: body.description.trim(),
  });

  return NextResponse.json({ note });
}
