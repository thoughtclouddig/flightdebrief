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
    // connectionTimeoutMillis matters: pg's default is to wait forever for a
    // free connection when the pool (max: 5) is exhausted -- a caller then
    // just hangs indefinitely with no error at all instead of failing fast.
    pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 8_000 });
  }
  return pool;
}
