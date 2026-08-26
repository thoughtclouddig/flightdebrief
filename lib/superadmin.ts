/**
 * Platform-level ("AfterFlight the company") admin access, entirely separate
 * from the per-organization `admin` OrgRole -- gated by an email allowlist
 * env var rather than a database role, same "unset means off" convention as
 * SITE_ACCESS_CODE (lib/auth/session.ts).
 */
export function isSuperadmin(email: string): boolean {
  const list = process.env.SUPERADMIN_EMAILS;
  if (!list) return false;
  const normalized = email.trim().toLowerCase();
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
