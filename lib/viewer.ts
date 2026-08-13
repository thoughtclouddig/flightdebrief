import { getRepository } from "@/lib/data";
import { getSupabaseSessionClient } from "@/lib/supabase/session";
import { DEMO_USER_ID, ORG_FALCON } from "@/lib/data/seed";
import type { Organization, OrgRole, User } from "@/lib/types";

export interface Viewer {
  user: User;
  organization: Organization;
  role: OrgRole;
}

/**
 * Resolves who's actually signed in, server-only. When Supabase is
 * configured: real session via lib/supabase/session.ts -> users row via
 * auth_user_id -> their organization_members row for role/org. Throws if
 * there's no session (proxy.ts should have already redirected before a
 * page gets this far -- this is a defensive backstop, not the primary guard)
 * or if a signed-in auth user has no matching app-level user/membership yet.
 *
 * When Supabase isn't configured (mock mode, e.g. local dev with no keys
 * set): no session concept exists, so this always resolves to the seeded
 * demo student -- matches how getRepository() falls back to MockRepository
 * in the same mode.
 */
export async function getViewer(): Promise<Viewer> {
  const repo = getRepository();
  const session = await getSupabaseSessionClient();

  if (!session) {
    const [user, organization] = await Promise.all([repo.getUser(DEMO_USER_ID), repo.getOrganization(ORG_FALCON.id)]);
    if (!user || !organization) throw new Error("Seed data missing -- demo user/org not found.");
    return { user, organization, role: "student" };
  }

  const {
    data: { user: authUser },
  } = await session.auth.getUser();
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const user = await repo.getUserByAuthId(authUser.id);
  if (!user) {
    throw new Error("Signed in, but no matching user profile -- invite may not have completed.");
  }

  const memberships = await repo.listMembershipsForUser(user.id);
  const activeMembership = memberships.find((m) => m.status === "active");
  if (!activeMembership) {
    throw new Error("Signed in, but not an active member of any organization.");
  }

  const organization = await repo.getOrganization(activeMembership.organizationId);
  if (!organization) {
    throw new Error("Membership points at a missing organization.");
  }

  return { user, organization, role: activeMembership.role };
}
