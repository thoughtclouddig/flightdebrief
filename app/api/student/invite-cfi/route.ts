import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { inviteUser } from "@/lib/auth/invite";
import { authorize } from "@/lib/auth/guard";
import { sendInviteEmail } from "@/lib/email";

interface InviteCfiBody {
  name: string;
  email: string;
}

/**
 * Self-serve equivalent of /api/admin/invite-cfi -- a solo student in their
 * own personal ("individual") org has no admin to add an instructor for
 * them, so they need to be able to do it themselves. Scoped to individual
 * orgs only: a student at a real school must still go through that school's
 * admin/CFI roster (app/api/admin/invite-cfi), not add arbitrary instructors
 * to a shared org.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as InviteCfiBody;
  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  const auth = await authorize("student");
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  if (viewer.organization.kind !== "individual") {
    return NextResponse.json(
      { error: "Only available for solo/individual accounts -- ask your school's admin to add instructors." },
      { status: 403 },
    );
  }

  const repo = getRepository();

  let user;
  try {
    user = await inviteUser({
      name: body.name.trim(),
      email: body.email.trim(),
      organizationId: viewer.organization.id,
      role: "instructor",
    });
  } catch (err) {
    console.error("[student/invite-cfi] failed to provision account:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 502 },
    );
  }
  // Keep the lightweight Instructor lookup (used by Flight.instructorId) in sync -- see lib/types.ts's note on the convention.
  await repo.getOrCreateInstructor(body.name.trim(), viewer.organization.id);

  const emailSent = await sendInviteEmail({
    to: user.email,
    name: user.name,
    role: "instructor",
    organizationName: viewer.organization.name,
  });

  return NextResponse.json({ user, emailSent });
}
