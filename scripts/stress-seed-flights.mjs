// Data-volume stress test seeder: bulk-inserts synthetic flights (and
// optionally debriefs) for one existing student, to check how dashboards and
// lists hold up at scale. Reuses the student's existing organization/
// aircraft/instructor rather than fabricating new FK targets. Not run
// automatically -- invoked by hand against a dev database only.
//
// Usage:
//   DATABASE_URL=... node scripts/stress-seed-flights.mjs <student-email> <count> [--with-debriefs]
//   DATABASE_URL=... node scripts/stress-seed-flights.mjs <student-email> --cleanup
import pg from "pg";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[stress-seed] DATABASE_URL is not set.");
  process.exit(1);
}
if (process.env.REPLIT_DEPLOYMENT) {
  console.error("[stress-seed] Refusing to run against a deployment. Dev database only.");
  process.exit(1);
}

const [, , email, countOrFlag, ...rest] = process.argv;
if (!email) {
  console.error("Usage: node scripts/stress-seed-flights.mjs <student-email> <count> [--with-debriefs]");
  console.error("       node scripts/stress-seed-flights.mjs <student-email> --cleanup");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

const SEED_TAG = "stress-seed"; // stashed in external_provider so cleanup can find these rows unambiguously

try {
  const { rows: userRows } = await client.query("SELECT id, organization_id FROM users WHERE email = $1", [email]);
  if (userRows.length === 0) {
    console.error(`[stress-seed] No user found with email ${email}.`);
    process.exit(1);
  }
  const student = userRows[0];

  if (countOrFlag === "--cleanup") {
    const { rowCount } = await client.query(
      "DELETE FROM flights WHERE student_id = $1 AND external_provider = $2",
      [student.id, SEED_TAG],
    );
    console.log(`[stress-seed] Deleted ${rowCount} seeded flights (and their cascaded debriefs) for ${email}.`);
    process.exit(0);
  }

  const count = Number.parseInt(countOrFlag, 10);
  if (!Number.isFinite(count) || count <= 0) {
    console.error("[stress-seed] <count> must be a positive integer.");
    process.exit(1);
  }
  const withDebriefs = rest.includes("--with-debriefs");

  const { rows: aircraftRows } = await client.query(
    "SELECT id FROM aircraft WHERE organization_id = $1 LIMIT 1",
    [student.organization_id],
  );
  if (aircraftRows.length === 0) {
    console.error("[stress-seed] No aircraft found for this student's organization -- create one first.");
    process.exit(1);
  }
  const aircraftId = aircraftRows[0].id;

  const { rows: instructorRows } = await client.query(
    "SELECT id FROM instructors WHERE organization_id = $1 LIMIT 1",
    [student.organization_id],
  );
  const instructorId = instructorRows[0]?.id ?? null;

  const AIRPORTS = ["KPAO", "KSQL", "KHWD", "KOAK", "KSJC", "KLVK", "KRHV"];
  const today = new Date();

  console.log(`[stress-seed] Seeding ${count} flights for ${email}${withDebriefs ? " (with debriefs)" : ""}...`);

  await client.query("BEGIN");
  for (let i = 0; i < count; i++) {
    const flightId = randomUUID();
    const daysAgo = Math.floor(Math.random() * 365);
    const flightDate = new Date(today.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);
    const dep = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
    let arr = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
    if (arr === dep) arr = AIRPORTS[(AIRPORTS.indexOf(dep) + 1) % AIRPORTS.length];

    await client.query(
      `INSERT INTO flights
         (id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
          flight_date, duration_minutes, instructor_id, external_provider, debrief_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        flightId,
        student.id,
        student.organization_id,
        aircraftId,
        dep,
        arr,
        flightDate,
        60 + Math.floor(Math.random() * 90),
        instructorId,
        SEED_TAG,
        withDebriefs ? "complete" : "not_started",
      ],
    );

    if (withDebriefs) {
      const structuredResult = {
        flightSummary: `Stress-seed flight #${i + 1}: pattern work at ${dep}, diversion to ${arr}.`,
        whatWeDid: ["Preflight briefing", "Traffic pattern work", "Postflight debrief"],
        wentWell: ["Checklist discipline", "Radio communications"],
        needsWork: ["Altitude control on downwind"],
        instructorGuidance: [],
        instructorAssistance: [],
        riskManagementNotes: [],
        assessmentDifferences: [],
        actionItems: ["Practice constant-altitude turns"],
        nextLessonFocus: ["Short-field landings"],
        studyReferences: [],
      };
      await client.query(
        `INSERT INTO debriefs (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with, guidance_mode)
         VALUES ($1, $2, $3, $4, $5, 'mock', 'freeform')`,
        [randomUUID(), flightId, "[stress-seed synthetic transcript]", 600, JSON.stringify(structuredResult)],
      );
    }
  }
  await client.query("COMMIT");

  console.log(`[stress-seed] Done. Inserted ${count} flights for ${email}.`);
  console.log(`[stress-seed] To remove them later: node scripts/stress-seed-flights.mjs ${email} --cleanup`);
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("[stress-seed] Failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
