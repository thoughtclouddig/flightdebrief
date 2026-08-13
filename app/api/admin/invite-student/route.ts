import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { inviteUser } from "@/lib/auth/invite";
import { authorize } from "@/lib/auth/guard";
import { sendInviteEmail } from "@/lib/email";

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
  const auth = await authorize("admin");
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  let user;
  try {
    user = await inviteUser({
      name: body.name.trim(),
      email: body.email.trim(),
      organizationId: viewer.organization.id,
      role: "student",
    });
  } catch (err) {
    console.error("[invite-student] failed to provision account:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 502 },
    );
  }

  if (body.primaryInstructorId) {
    await repo.linkStudentInstructor({
      studentId: user.id,
      instructorId: body.primaryInstructorId,
      organizationId: viewer.organization.id,
      isPrimary: true,
    });
  }

  const emailSent = await sendInviteEmail({
    to: user.email,
    name: user.name,
    role: "student",
    organizationName: viewer.organization.name,
  });

  return NextResponse.json({ user, emailSent });
}
