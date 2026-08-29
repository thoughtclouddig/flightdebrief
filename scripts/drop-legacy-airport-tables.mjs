/**
 * Removes the first cut of the airport tables, which counted movements.
 *
 * They were superseded by airport_flights once the FR24 probe showed the API
 * reports flights, not movements. They only ever held synthetic rows, so
 * there is nothing to migrate -- and leaving a table whose name implies the
 * wrong unit is how the wrong number gets published later.
 *
 * Separate from db/schema.sql on purpose: init-db runs on every build, and a
 * destructive statement does not belong on that path.
 *
 *   node scripts/drop-legacy-airport-tables.mjs --confirm
 */
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[legacy] DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.argv.includes("--confirm")) {
  console.log("[legacy] This drops airport_operations. Re-run with --confirm to proceed.");
  process.exit(0);
}

const client = new pg.Client({ connectionString });
await client.connect();
const { rows } = await client.query(
  `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name = 'airport_operations'`,
);
if (!rows[0].n) {
  console.log("[legacy] airport_operations does not exist. Nothing to do.");
} else {
  const { rows: counts } = await client.query("SELECT count(*)::int AS n FROM airport_operations");
  await client.query("DROP TABLE airport_operations CASCADE");
  console.log(`[legacy] dropped airport_operations (${counts[0].n} synthetic rows).`);
}
await client.end();
