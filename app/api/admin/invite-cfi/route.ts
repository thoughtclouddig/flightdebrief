import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { inviteUser } from "@/lib/auth/invite";
import { authorize } from "@/lib/auth/guard";

interface InviteCfiBody {
  name: string;
  email: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as InviteCfiBody;
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
      role: "instructor",
    });
  } catch (err) {
    console.error("[invite-cfi] failed to provision account:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 502 },
    );
  }
  // Keep the lightweight Instructor lookup (used by Flight.instructorId) in sync -- see lib/types.ts's note on the convention.
  await repo.getOrCreateInstructor(body.name.trim(), viewer.organization.id);

  return NextResponse.json({ user });
}
