// Idempotent database initializer: applies db/schema.sql (CREATE TABLE IF NOT
// EXISTS + ADD COLUMN IF NOT EXISTS + ON CONFLICT DO NOTHING seeds) to
// DATABASE_URL. Runs before the dev server starts (see package.json "dev")
// AND as part of "build" (see package.json "build") -- production has its own
// separate database from the dev workspace, and nothing else ever applies
// schema changes to it, so this must run at build/publish time too, not just
// in dev. Safe to run against any environment: every statement in
// db/schema.sql is idempotent, so re-running it changes nothing once already
// applied.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[init-db] DATABASE_URL is not set; skipping schema init.");
  process.exit(0);
}

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "schema.sql");
const sql = readFileSync(schemaPath, "utf8");

const client = new pg.Client({ connectionString });
try {
  await client.connect();
  await client.query(sql);
  console.log("[init-db] identity schema ensured (db/schema.sql).");
} catch (err) {
  console.error("[init-db] failed to apply db/schema.sql:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
