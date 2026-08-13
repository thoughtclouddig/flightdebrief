import { getDb } from "@/lib/db";
import { PostgresRepository } from "./postgres-repository";
import type { Repository } from "./types";

export type { Repository } from "./types";
export {
  DEMO_USER_ID,
  SEED_PENDING_TRANSCRIPT,
  ORG_FALCON,
  USER_ANDY,
  USER_DANNY,
  USER_MARIA,
  USER_SARAH,
  USER_JORDAN,
} from "./seed";

let cached: Repository | null = null;

/**
 * Server-only: Replit Postgres-backed repository (DATABASE_URL), the same
 * database that holds identity data (lib/auth/store.ts). Throws at first use
 * if DATABASE_URL is missing -- persistence is required, there is no
 * in-memory fallback.
 */
export function getRepository(): Repository {
  if (cached) return cached;
  cached = new PostgresRepository(getDb());
  return cached;
}
