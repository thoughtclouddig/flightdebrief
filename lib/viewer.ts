import { cookies } from "next/headers";
import { ACTIVE_MEMBERSHIP_COOKIE, getSession } from "@/lib/auth/session";
import * as store from "@/lib/auth/store";
import type { Organization, OrgRole, User } from "@/lib/types";
import { isMembershipSwitcherEnabled } from "@/lib/auth/membership-switcher";

export interface Viewer {
  user: User;
  organization: Organization;
  role: OrgRole;
}

/**
 * Resolves who's actually signed in, server-only. Replit Auth session
 * (signed cookie) -> users row via auth_user_id -> organization_members row
 * for role/org, all from Replit Postgres (the source of truth for app-level
 * identity). Throws if there's no session (proxy.ts should have already
 * redirected before a page gets this far -- this is a defensive backstop,
 * not the primary guard) or if a signed-in Replit user has no matching
 * app-level user/membership yet.
 */
export async function getViewer(): Promise<Viewer> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not signed in.");
  }

  const user = await store.getUserByAuthId(session.sub);
  if (!user) {
    throw new Error("Signed in, but no matching user profile -- ask an admin for an invite.");
  }

  const memberships = await store.listMembershipsForUser(user.id);
  // The membership selector is a development-only test aid. In production,
  // always use the account's normal first active membership.
  const preferredId = isMembershipSwitcherEnabled()
    ? (await cookies()).get(ACTIVE_MEMBERSHIP_COOKIE)?.value
    : undefined;
  const activeMembership =
    memberships.find((m) => m.id === preferredId && m.status === "active") ??
    memberships.find((m) => m.status === "active");
  if (!activeMembership) {
    throw new Error("Signed in, but not an active member of any organization.");
  }

  const organization = await store.getOrganization(activeMembership.organizationId);
  if (!organization) {
    throw new Error("Membership points at a missing organization.");
  }

  return { user, organization, role: activeMembership.role };
}

export interface MembershipOption {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
}

/**
 * Every active membership a user holds, enriched with org names -- feeds the
 * development-only membership switcher (components/user-menu.tsx).
 */
export async function listMembershipOptions(userId: string): Promise<MembershipOption[]> {
  const memberships = (await store.listMembershipsForUser(userId)).filter((m) => m.status === "active");
  const options = await Promise.all(
    memberships.map(async (m) => {
      const org = await store.getOrganization(m.organizationId);
      return org ? { membershipId: m.id, organizationId: org.id, organizationName: org.name, role: m.role } : null;
    }),
  );
  return options.filter((o): o is MembershipOption => o !== null);
}
