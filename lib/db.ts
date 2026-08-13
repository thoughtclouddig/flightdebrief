import { Pool } from "pg";

/**
 * Replit Postgres pool (DATABASE_URL) -- source of truth for app-level
 * identity: users, organizations, organization_members. Server-only.
 */
let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set -- the Replit Postgres database is required for auth.");
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
