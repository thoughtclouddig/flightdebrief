import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

interface InviteStudentBody {
  name: string;
  email: string;
  primaryInstructorId?: string;
}

/** Simplified "invitation": creates the account immediately, no real email is sent. */
export async function POST(request: Request) {
  const body = (await request.json()) as InviteStudentBody;
  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  const repo = getRepository();
  const viewer = await getViewer();

  const user = await repo.createUser({ name: body.name.trim(), email: body.email.trim() });
  await repo.addMember({ organizationId: viewer.organization.id, userId: user.id, role: "student" });

  if (body.primaryInstructorId) {
    await repo.linkStudentInstructor({
      studentId: user.id,
      instructorId: body.primaryInstructorId,
      organizationId: viewer.organization.id,
      isPrimary: true,
    });
  }

  return NextResponse.json({ user });
}
