import { getSession } from "@/lib/auth/session";
import * as store from "@/lib/auth/store";
import type { Organization, OrgRole, User } from "@/lib/types";

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
  const activeMembership = memberships.find((m) => m.status === "active");
  if (!activeMembership) {
    throw new Error("Signed in, but not an active member of any organization.");
  }

  const organization = await store.getOrganization(activeMembership.organizationId);
  if (!organization) {
    throw new Error("Membership points at a missing organization.");
  }

  return { user, organization, role: activeMembership.role };
}
