import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { ACTIVE_MEMBERSHIP_COOKIE } from "@/lib/auth/session";
import { listMembershipsForUser } from "@/lib/auth/store";

/**
 * Sets which of the caller's own organization_members rows is "active" --
 * read back by lib/viewer.ts's getViewer(). Serves both a CFI switching
 * between multiple schools and a solo independent CFI switching between
 * their admin and instructor rows in the same org (see lib/auth/store.ts's
 * resolveSignupOnLogin, which creates both).
 */
export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { membershipId?: string };
  const membershipId = body.membershipId;
  if (!membershipId) {
    return NextResponse.json({ error: "Missing membershipId" }, { status: 400 });
  }

  const memberships = await listMembershipsForUser(auth.viewer.user.id);
  const target = memberships.find((m) => m.id === membershipId && m.status === "active");
  if (!target) {
    return NextResponse.json({ error: "Not a membership of yours" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, membershipId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
