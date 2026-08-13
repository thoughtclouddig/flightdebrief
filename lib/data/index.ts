import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MockRepository } from "./mock-repository";
import { SupabaseRepository } from "./supabase-repository";
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

/** Server-only: Supabase-backed when configured, otherwise the seeded in-memory mock. */
export function getRepository(): Repository {
  if (cached) return cached;
  const supabase = getSupabaseServerClient();
  cached = supabase ? new SupabaseRepository(supabase) : new MockRepository();
  return cached;
}
