import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

interface InviteCfiBody {
  name: string;
  email: string;
}

/** Simplified "invitation": creates the account immediately, no real email is sent. */
export async function POST(request: Request) {
  const body = (await request.json()) as InviteCfiBody;
  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  const repo = getRepository();
  const viewer = await getViewer();

  const user = await repo.createUser({ name: body.name.trim(), email: body.email.trim() });
  await repo.addMember({ organizationId: viewer.organization.id, userId: user.id, role: "instructor" });
  // Keep the lightweight Instructor lookup (used by Flight.instructorId) in sync -- see lib/types.ts's note on the convention.
  await repo.getOrCreateInstructor(body.name.trim(), viewer.organization.id);

  return NextResponse.json({ user });
}
