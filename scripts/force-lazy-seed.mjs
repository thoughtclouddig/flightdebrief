// One-off dev utility: PostgresRepository only seeds lib/data/seed.ts's demo
// data lazily, the first time something calls one of its own methods (see
// PostgresRepository.db() in lib/data/postgres-repository.ts) -- and the
// login path (lib/auth/store.ts's getUserByEmail/getUserByAuthId) queries
// the database directly via getDb(), bypassing that gate entirely. On a
// database that starts truly empty, that's a closed loop: you can't log in
// as a seed persona (not seeded yet) without a repository call, and nothing
// unauthenticated makes one.
//
// This script breaks that loop by making a single real repository call --
// not duplicating the seed logic, just triggering the exact same lazy path
// an authenticated page load would. Safe to re-run: every insert in
// seedDomainTables is ON CONFLICT (id) DO NOTHING.
//
// Usage (respects SEED_DEMO_DATA / FORCE_RESEED from the current shell):
//   npx tsx scripts/force-lazy-seed.mjs
import { getRepository } from "../lib/data/index.ts";

const repo = getRepository();
await repo.listFlights({ studentId: "force-lazy-seed-trigger" });
console.log("[force-lazy-seed] repository call complete -- check the server log above for the seed line.");
