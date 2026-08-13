import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import type { Organization, OrganizationMember, OrgRole, User } from "@/lib/types";
import type { SessionClaims } from "@/lib/auth/session";

/**
 * Postgres-backed identity store -- the source of truth for app-level
 * user/org/role data (Replit Postgres via DATABASE_URL). Replaces the
 * Supabase auth linkage; users.auth_user_id now holds the Replit user id
 * (OIDC `sub`).
 */

interface UserRow {
  id: string;
  name: string;
  email: string;
  auth_user_id: string | null;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    authUserId: row.auth_user_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getUserByAuthId(authUserId: string): Promise<User | null> {
  const { rows } = await getDb().query<UserRow>("SELECT * FROM users WHERE auth_user_id = $1", [authUserId]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await getDb().query<UserRow>("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function createUser(input: { name: string; email: string; authUserId?: string | null; id?: string }): Promise<User> {
  const { rows } = await getDb().query<UserRow>(
    "INSERT INTO users (id, name, email, auth_user_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [input.id ?? `user-${randomUUID()}`, input.name, input.email, input.authUserId ?? null],
  );
  return toUser(rows[0]);
}

export async function listMembershipsForUser(userId: string): Promise<OrganizationMember[]> {
  const { rows } = await getDb().query(
    "SELECT * FROM organization_members WHERE user_id = $1 ORDER BY created_at",
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    role: r.role as OrgRole,
    status: r.status,
    certificateType: r.certificate_type,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function createMembership(input: {
  organizationId: string;
  userId: string;
  role: OrgRole;
  certificateType?: "PRIVATE" | null;
  id?: string;
}): Promise<void> {
  await getDb().query(
    `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (organization_id, user_id, role) DO NOTHING`,
    [input.id ?? `member-${randomUUID()}`, input.organizationId, input.userId, input.role, input.certificateType ?? null],
  );
}

export async function setMembershipStatus(memberId: string, status: "active" | "inactive"): Promise<void> {
  await getDb().query("UPDATE organization_members SET status = $1 WHERE id = $2", [status, memberId]);
}

export async function setMembershipCertificateType(memberId: string, certificateType: "PRIVATE" | null): Promise<void> {
  await getDb().query("UPDATE organization_members SET certificate_type = $1 WHERE id = $2", [certificateType, memberId]);
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const { rows } = await getDb().query("SELECT * FROM organizations WHERE id = $1", [id]);
  if (!rows[0]) return null;
  return { id: rows[0].id, name: rows[0].name, kind: rows[0].kind, createdAt: new Date(rows[0].created_at).toISOString() };
}

const DEFAULT_ORG_ID = "org-falcon";

/**
 * Called from the OIDC callback after a successful Replit login.
 * - If a users row is already linked to this Replit account, return it.
 * - Else, if a users row exists with the same email (i.e. they were invited),
 *   link it to this Replit account.
 * - Else, if no Replit account has ever been linked, this is the app owner's
 *   first login: create them as an admin of the default organization.
 * - Otherwise return null -- the app is invite-only.
 */
export async function resolveUserOnLogin(claims: SessionClaims): Promise<User | null> {
  const linked = await getUserByAuthId(claims.sub);
  if (linked) return linked;

  if (claims.email) {
    const byEmail = await getUserByEmail(claims.email);
    if (byEmail && !byEmail.authUserId) {
      await getDb().query("UPDATE users SET auth_user_id = $1 WHERE id = $2", [claims.sub, byEmail.id]);
      return { ...byEmail, authUserId: claims.sub };
    }
  }

  // First-ever login bootstraps the app owner as admin. Run under an
  // advisory lock so two concurrent first logins can't both become admin.
  const db = await getDb().connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(874312)");
    const { rows } = await db.query("SELECT 1 FROM users WHERE auth_user_id IS NOT NULL LIMIT 1");
    if (rows.length > 0) {
      await db.query("ROLLBACK");
      return null;
    }
    const id = `user-${randomUUID()}`;
    const inserted = await db.query<UserRow>(
      "INSERT INTO users (id, name, email, auth_user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, claims.name ?? claims.email ?? "Owner", claims.email ?? `${claims.sub}@replit.user`, claims.sub],
    );
    await db.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role)
       VALUES ($1, $2, $3, 'admin')`,
      [`member-${randomUUID()}`, DEFAULT_ORG_ID, id],
    );
    await db.query("COMMIT");
    return toUser(inserted.rows[0]);
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    db.release();
  }
}
