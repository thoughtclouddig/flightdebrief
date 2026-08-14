// Removes the Falcon Aviation demo rows that seedDomainTables (SEED_DEMO_DATA)
// inserted, by their stable seeded ids (see lib/data/seed.ts). Real users and
// their data are untouched: only rows with these exact ids are deleted, and a
// seed user is preserved if someone has actually signed in as them
// (auth_user_id is set). The 'org-falcon' organization row itself is kept —
// it is real identity data that every signup joins (db/schema.sql).
//
// Idempotent: safe to run repeatedly; reports how many rows each pass removed.
//
// Usage:
//   node scripts/clear-demo-data.mjs
//   node scripts/clear-demo-data.mjs --confirm-production   # required in prod
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[clear-demo-data] DATABASE_URL is not set; nothing to do.");
  process.exit(1);
}

const confirmProduction = process.argv.includes("--confirm-production");
const looksLikeProduction = Boolean(process.env.REPLIT_DEPLOYMENT);
if (looksLikeProduction && !confirmProduction) {
  console.error(
    "[clear-demo-data] Refusing to run against a production deployment.\n" +
      "Re-run with --confirm-production if you really want to delete the demo rows from production.",
  );
  process.exit(1);
}

// --- Stable seeded ids (must match lib/data/seed.ts) -------------------------

const SEED_USER_IDS = ["user-andy", "user-danny", "user-maria", "user-sarah", "user-jordan"];
const SEED_MEMBER_IDS = ["member-andy", "member-danny", "member-maria", "member-sarah", "member-jordan"];
const SEED_LINK_IDS = ["link-andy-danny", "link-andy-maria", "link-sarah-danny"];
const SEED_AIRCRAFT_IDS = ["aircraft-da40-n123ab", "aircraft-c172-n731sp"];
const SEED_INSTRUCTOR_IDS = ["user-danny", "user-maria"]; // Instructor.id === User.id by convention
const SEED_RESERVATION_IDS = ["reservation-andy-today", "reservation-sarah-today"];
const SEED_FLIGHT_IDS = ["flight-1", "flight-2", "flight-3", "flight-x1", "flight-x2", "flight-x3", "flight-sarah-1"];
const SEED_DEBRIEF_IDS = ["debrief-1", "debrief-2", "debrief-x1", "debrief-x2", "debrief-x3", "debrief-sarah-1"];

const client = new pg.Client({ connectionString });

async function del(label, sql, params) {
  const { rowCount } = await client.query(sql, params);
  console.log(`[clear-demo-data] ${label}: ${rowCount} row(s) deleted`);
  return rowCount;
}

try {
  await client.connect();
  await client.query("BEGIN");

  // Children before parents (some FKs cascade, but be explicit and complete).
  // Training items/signals are keyed by debrief id prefixes (e.g.
  // 'debrief-1-keep-0', 'debrief-1-signal-0'), so match on debrief_id/flight_id.
  await del(
    "training_signals",
    "DELETE FROM training_signals WHERE debrief_id = ANY($1) OR flight_id = ANY($2)",
    [SEED_DEBRIEF_IDS, SEED_FLIGHT_IDS],
  );
  await del(
    "training_items",
    "DELETE FROM training_items WHERE debrief_id = ANY($1) OR flight_id = ANY($2)",
    [SEED_DEBRIEF_IDS, SEED_FLIGHT_IDS],
  );
  await del("debriefs", "DELETE FROM debriefs WHERE id = ANY($1) OR flight_id = ANY($2)", [
    SEED_DEBRIEF_IDS,
    SEED_FLIGHT_IDS,
  ]);
  await del("flights", "DELETE FROM flights WHERE id = ANY($1)", [SEED_FLIGHT_IDS]);
  await del("reservations", "DELETE FROM reservations WHERE id = ANY($1)", [SEED_RESERVATION_IDS]);

  // A seed account is "claimed" once a real person has signed in as it
  // (auth_user_id is set). Claimed accounts must stay fully functional, so we
  // keep not just their users row but also their membership (getViewer()
  // requires an active membership), their instructor lookup row, and any
  // student/instructor links that involve a claimed party.
  await del(
    "student_instructors",
    `DELETE FROM student_instructors si WHERE si.id = ANY($1)
       AND EXISTS (SELECT 1 FROM users s WHERE s.id = si.student_id AND s.auth_user_id IS NULL)
       AND EXISTS (SELECT 1 FROM users i WHERE i.id = si.instructor_id AND i.auth_user_id IS NULL)`,
    [SEED_LINK_IDS],
  );
  await del(
    "organization_members",
    `DELETE FROM organization_members m WHERE m.id = ANY($1)
       AND EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id AND u.auth_user_id IS NULL)`,
    [SEED_MEMBER_IDS],
  );

  // Seed aircraft: only if no remaining (real) flights or reservations still
  // reference them — flights.aircraft_id is ON DELETE RESTRICT anyway.
  await del(
    "aircraft",
    `DELETE FROM aircraft a WHERE a.id = ANY($1)
       AND NOT EXISTS (SELECT 1 FROM flights f WHERE f.aircraft_id = a.id)
       AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.aircraft_id = a.id)`,
    [SEED_AIRCRAFT_IDS],
  );

  // Seed instructor lookup rows: only if the matching user account is
  // unclaimed (a claimed Danny/Maria keeps instructor capability) and no
  // remaining flights reference them.
  await del(
    "instructors",
    `DELETE FROM instructors i WHERE i.id = ANY($1)
       AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = i.id AND u.auth_user_id IS NOT NULL)
       AND NOT EXISTS (SELECT 1 FROM flights f WHERE f.instructor_id = i.id)`,
    [SEED_INSTRUCTOR_IDS],
  );

  // Seed users: preserve any that a real person has claimed (auth_user_id set),
  // and any that still own non-seed data (flights, reservations, signals,
  // student/instructor links).
  await del(
    "users",
    `DELETE FROM users u WHERE u.id = ANY($1)
       AND u.auth_user_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM flights f WHERE f.student_id = u.id)
       AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.student_id = u.id OR r.instructor_id = u.id)
       AND NOT EXISTS (SELECT 1 FROM training_signals s WHERE s.student_id = u.id)
       AND NOT EXISTS (SELECT 1 FROM student_instructors si WHERE si.student_id = u.id OR si.instructor_id = u.id)`,
    [SEED_USER_IDS],
  );

  await client.query("COMMIT");
  console.log("[clear-demo-data] Done. The 'org-falcon' organization row is kept (real identity data).");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("[clear-demo-data] Failed, rolled back:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
