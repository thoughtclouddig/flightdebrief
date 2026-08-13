import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { inviteUser } from "@/lib/auth/invite";

interface InviteStudentBody {
  name: string;
  email: string;
  primaryInstructorId?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as InviteStudentBody;
  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  const repo = getRepository();
  const viewer = await getViewer();

  let user;
  try {
    user = await inviteUser({ name: body.name.trim(), email: body.email.trim(), origin: new URL(request.url).origin });
  } catch (err) {
    console.error("[invite-student] failed to provision account:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 502 },
    );
  }

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
