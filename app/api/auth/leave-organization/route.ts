import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { ACTIVE_MEMBERSHIP_COOKIE } from "@/lib/auth/session";
import { createMembership, createOrganization, getOrganization, listMembershipsForUser, setMembershipStatus } from "@/lib/auth/store";

/**
 * "Leave my school, go solo": deactivates the caller's school membership
 * (soft -- setMembershipStatus, same as everywhere else memberships are
 * removed, so their flight/debrief history stays attached to the school org
 * it actually happened under) and gives them a personal "individual" org to
 * keep training under going forward, same shape self-serve solo signup
 * creates (see lib/auth/store.ts's resolveSignupOnLogin). Reuses an existing
 * personal org if this user already has one (e.g. they left before and are
 * leaving again) instead of accumulating duplicates.
 *
 * Scoped to students for now -- an instructor/admin leaving a school is a
 * bigger decision (their students/flights stay behind) that deserves its
 * own confirmation flow, not this one-click action.
 */
export async function POST() {
  const auth = await authorize("student");
  if (auth.response) return auth.response;
  const { viewer } = auth;

  if (viewer.organization.kind !== "school") {
    return NextResponse.json({ error: "You're not part of a school." }, { status: 400 });
  }

  const memberships = await listMembershipsForUser(viewer.user.id);
  const schoolMembership = memberships.find(
    (m) => m.organizationId === viewer.organization.id && m.role === "student" && m.status === "active",
  );
  if (!schoolMembership) {
    return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  }

  let personalMembershipId: string | null = null;
  let personalOrgName = "";
  for (const m of memberships) {
    if (m.id === schoolMembership.id) continue;
    const org = await getOrganization(m.organizationId);
    if (org?.kind === "individual") {
      personalMembershipId = m.id;
      personalOrgName = org.name;
      if (m.status !== "active") await setMembershipStatus(m.id, "active");
      break;
    }
  }

  if (!personalMembershipId) {
    const org = await createOrganization({ name: `${viewer.user.name}'s Flights`, kind: "individual" });
    const memberId = `member-${randomUUID()}`;
    await createMembership({ id: memberId, organizationId: org.id, userId: viewer.user.id, role: "student" });
    personalMembershipId = memberId;
    personalOrgName = org.name;
  }

  await setMembershipStatus(schoolMembership.id, "inactive");

  const response = NextResponse.json({ ok: true, organizationName: personalOrgName });
  response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, personalMembershipId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
