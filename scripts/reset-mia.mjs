// One-off dev utility: deletes user-mia so the next FORCE_RESEED re-inserts
// her fresh (flights/debriefs/training_items/training_signals/flight_tasks/
// debrief_assessments/debrief_assessment_ratings/organization_members/
// student_instructors all cascade off users.id -- see db/schema.sql). Needed
// because seedDomainTables()'s inserts are ON CONFLICT (id) DO NOTHING, so a
// transcript/content edit in lib/data/seed.ts never overwrites an
// already-seeded row with the same id -- only a fresh insert picks it up.
// Not part of the app; run manually, then FORCE_RESEED=1 npm run dev.
//
// Usage:
//   node scripts/reset-mia.mjs
//   node scripts/reset-mia.mjs --confirm-production   # required in prod
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[reset-mia] DATABASE_URL is not set.");
  process.exit(1);
}

const confirmProduction = process.argv.includes("--confirm-production");
const looksLikeProduction = Boolean(process.env.REPLIT_DEPLOYMENT);
if (looksLikeProduction && !confirmProduction) {
  console.error(
    "[reset-mia] Refusing to run against a production deployment.\n" +
      "Re-run with --confirm-production if you really want to delete user-mia from production.",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString });
try {
  await client.connect();
  const { rowCount } = await client.query("DELETE FROM users WHERE id = 'user-mia'");
  console.log(`[reset-mia] deleted ${rowCount} user row(s) (cascades her flights/debriefs/signals/etc).`);
} catch (err) {
  console.error("[reset-mia] failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
