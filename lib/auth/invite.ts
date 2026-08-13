import { getRepository } from "@/lib/data";
import * as store from "@/lib/auth/store";
import type { OrgRole, User } from "@/lib/types";

/**
 * Shared by both invite-student and invite-cfi routes. With Replit Auth
 * there's no account to provision -- we create the app-level `users` row
 * (keyed by email) plus the organization membership in BOTH stores:
 * Replit Postgres (source of truth for identity/role -- lib/auth/store.ts)
 * and the data repository (flight/roster data). The same ids are used in
 * both so cross-references line up. When the person first logs in with the
 * Replit account using that email, the OIDC callback links
 * users.auth_user_id automatically.
 */
export async function inviteUser(input: {
  name: string;
  email: string;
  organizationId: string;
  role: OrgRole;
}): Promise<User> {
  const email = input.email.trim();
  const name = input.name.trim();
  const repo = getRepository();

  // Repository row first -- it generates the id both stores share.
  const repoUser = (await repo.getUserByEmail(email)) ?? (await repo.createUser({ name, email }));

  let user = await store.getUserByEmail(email);
  if (!user) {
    user = await store.createUser({ id: repoUser.id, name, email });
  }

  const member = await repo.addMember({ organizationId: input.organizationId, userId: repoUser.id, role: input.role });
  await store.createMembership({
    id: member.id,
    organizationId: input.organizationId,
    userId: user.id,
    role: input.role,
  });

  return user;
}
