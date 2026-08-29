/**
 * Removes the first cut of the airport tables, which counted movements.
 *
 * They were superseded by airport_flights once the FR24 probe showed the API
 * reports flights, not movements. Neither is worth migrating: the operations
 * table only ever held synthetic rows, and the insights table is derived --
 * a recompute rebuilds it from airport_flights in seconds.
 *
 * Dropping rather than altering is the right call for the insights table
 * specifically. CREATE TABLE IF NOT EXISTS does nothing to a table that
 * already exists, so the old movement-shaped columns survive a schema change
 * and the first insert fails on the column that was renamed. Patching that
 * with ALTERs would mean carrying sample_size and flight_count side by side,
 * which is exactly the ambiguity the rename existed to remove.
 *
 * Separate from db/schema.sql on purpose: init-db runs on every build, and a
 * destructive statement does not belong on that path.
 *
 *   node scripts/drop-legacy-airport-tables.mjs --confirm
 *   node scripts/init-db.mjs   # recreates airport_insights in the new shape
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
const exists = async (table) => {
  const { rows } = await client.query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name = $1",
    [table],
  );
  return rows[0].n > 0;
};

// The observation log: synthetic rows only, superseded by airport_flights.
if (await exists("airport_operations")) {
  const { rows } = await client.query("SELECT count(*)::int AS n FROM airport_operations");
  await client.query("DROP TABLE airport_operations CASCADE");
  console.log(`[legacy] dropped airport_operations (${rows[0].n} synthetic rows).`);
} else {
  console.log("[legacy] airport_operations already gone.");
}

// The summary: dropped only when it still carries the old movement-shaped
// column, so re-running this after the rebuild is a no-op rather than a
// pointless wipe of good data.
if (await exists("airport_insights")) {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_name = 'airport_insights' AND column_name = 'sample_size'`,
  );
  if (rows[0].n) {
    await client.query("DROP TABLE airport_insights CASCADE");
    console.log("[legacy] dropped airport_insights — it was still movement-shaped. A recompute rebuilds it.");
  } else {
    console.log("[legacy] airport_insights is already flight-shaped. Left alone.");
  }
}

console.log("[legacy] now run: node scripts/init-db.mjs");
await client.end();
