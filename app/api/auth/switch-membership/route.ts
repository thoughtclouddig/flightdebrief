import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { ACTIVE_MEMBERSHIP_COOKIE } from "@/lib/auth/session";
import { listMembershipsForUser } from "@/lib/auth/store";
import { isMembershipSwitcherEnabled } from "@/lib/auth/membership-switcher";

/**
 * Development-only test endpoint for selecting one of the caller's own
 * memberships. It is deliberately unavailable in published deployments.
 */
export async function POST(request: Request) {
  if (!isMembershipSwitcherEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
