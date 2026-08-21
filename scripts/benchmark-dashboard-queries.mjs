/**
 * Measures the exact flight and reservation list shapes used by the product
 * against generated school-scale data. All data and indexes live in temporary
 * tables inside one transaction and are rolled back before this script exits.
 *
 * Run only against a development/staging database:
 *   node scripts/benchmark-dashboard-queries.mjs
 */
import pg from "pg";

if (process.env.REPLIT_DEPLOYMENT) {
  throw new Error("Performance benchmarks must not run in a deployment.");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the performance benchmark.");
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const sampleCount = 7;

const queries = [
  {
    name: "Student flight history",
    text: `SELECT f.*, row_to_json(a.*) AS aircraft_row, row_to_json(i.*) AS instructor_row
           FROM flights f
           JOIN aircraft a ON a.id = f.aircraft_id
           LEFT JOIN instructors i ON i.id = f.instructor_id
           WHERE f.student_id = $1
           ORDER BY f.flight_date DESC, f.created_at DESC`,
    values: ["perf-student-1"],
  },
  {
    name: "School flight dashboard",
    text: `SELECT f.*, row_to_json(a.*) AS aircraft_row, row_to_json(i.*) AS instructor_row
           FROM flights f
           JOIN aircraft a ON a.id = f.aircraft_id
           LEFT JOIN instructors i ON i.id = f.instructor_id
           WHERE f.organization_id = $1
           ORDER BY f.flight_date DESC, f.created_at DESC`,
    values: ["perf-school-1"],
  },
  {
    name: "CFI flight history",
    text: `SELECT f.*, row_to_json(a.*) AS aircraft_row, row_to_json(i.*) AS instructor_row
           FROM flights f
           JOIN aircraft a ON a.id = f.aircraft_id
           LEFT JOIN instructors i ON i.id = f.instructor_id
           WHERE f.instructor_id = $1
           ORDER BY f.flight_date DESC, f.created_at DESC`,
    values: ["perf-instructor-1"],
  },
  {
    name: "School instructor flights",
    text: `SELECT f.*, row_to_json(a.*) AS aircraft_row, row_to_json(i.*) AS instructor_row
           FROM flights f
           JOIN aircraft a ON a.id = f.aircraft_id
           LEFT JOIN instructors i ON i.id = f.instructor_id
           WHERE f.instructor_id = $1 AND f.organization_id = $2
           ORDER BY f.flight_date DESC, f.created_at DESC`,
    values: ["perf-instructor-1", "perf-school-1"],
  },
  {
    name: "Instructor schedule",
    text: `SELECT * FROM reservations
           WHERE organization_id = $1 AND instructor_id = $2
           ORDER BY scheduled_start`,
    values: ["perf-school-1", "perf-instructor-1"],
  },
  {
    name: "Student schedule",
    text: `SELECT * FROM reservations
           WHERE student_id = $1
           ORDER BY scheduled_start`,
    values: ["perf-student-1"],
  },
];

function percentile(samples, p) {
  const ordered = [...samples].sort((a, b) => a - b);
  return ordered[Math.ceil(ordered.length * p) - 1];
}

function findPlanNodes(plan, nodes = []) {
  const indexName = plan["Index Name"];
  nodes.push(indexName ? `${plan["Node Type"]} (${indexName})` : plan["Node Type"]);
  for (const child of plan.Plans ?? []) findPlanNodes(child, nodes);
  return nodes;
}

async function explain(query) {
  const { rows } = await client.query({
    text: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query.text}`,
    values: query.values,
  });
  const result = rows[0]["QUERY PLAN"][0];
  return {
    executionMs: result["Execution Time"],
    plan: findPlanNodes(result.Plan).join(" → "),
  };
}

async function measure(label) {
  const measurements = [];
  for (const query of queries) {
    const samples = [];
    let plan = "";
    for (let i = 0; i < sampleCount; i += 1) {
      const result = await explain(query);
      samples.push(result.executionMs);
      plan = result.plan;
    }
    measurements.push({
      query: query.name,
      medianMs: percentile(samples, 0.5),
      p95Ms: percentile(samples, 0.95),
      plan,
    });
  }

  console.log(`\n${label}`);
  console.table(
    measurements.map((row) => ({
      query: row.query,
      "p50 ms": row.medianMs.toFixed(2),
      "p95 ms": row.p95Ms.toFixed(2),
      plan: row.plan,
    })),
  );
  return measurements;
}

async function seedBenchmarkVolume() {
  await client.query(`
    CREATE TEMP TABLE aircraft (LIKE public.aircraft INCLUDING DEFAULTS) ON COMMIT DROP;
    CREATE TEMP TABLE instructors (LIKE public.instructors INCLUDING DEFAULTS) ON COMMIT DROP;
    CREATE TEMP TABLE flights (LIKE public.flights INCLUDING DEFAULTS) ON COMMIT DROP;
    CREATE TEMP TABLE reservations (LIKE public.reservations INCLUDING DEFAULTS) ON COMMIT DROP;

    INSERT INTO instructors (id, name, organization_id)
    SELECT
      'perf-instructor-' || n,
      'Benchmark Instructor ' || n,
      'perf-school-' || ((n - 1) % 5 + 1)
    FROM generate_series(1, 20) AS n;

    INSERT INTO aircraft (id, tail_number, type, organization_id)
    SELECT
      'perf-aircraft-' || n,
      'N' || (7000 + n)::text || 'PF',
      'C172',
      'perf-school-' || ((n - 1) % 5 + 1)
    FROM generate_series(1, 10) AS n;

    INSERT INTO flights (
      id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
      flight_date, duration_minutes, instructor_id, debrief_status, created_at
    )
    SELECT
      'perf-flight-' || n,
      'perf-student-' || ((n - 1) % 250 + 1),
      'perf-school-' || (((n - 1) / 20) % 5 + 1),
      'perf-aircraft-' || ((n - 1) % 10 + 1),
      'KPAO',
      'KPAO',
      to_char(date '2024-01-01' + ((n - 1) % 700), 'YYYY-MM-DD'),
      60,
      'perf-instructor-' || ((n - 1) % 20 + 1),
      'complete',
      now() - (n * interval '1 minute')
    FROM generate_series(1, 30000) AS n;

    INSERT INTO reservations (
      id, organization_id, student_id, instructor_id, aircraft_id,
      scheduled_start, scheduled_end, status, created_at
    )
    SELECT
      'perf-reservation-' || n,
      'perf-school-' || (((n - 1) / 20) % 5 + 1),
      'perf-student-' || ((n - 1) % 250 + 1),
      'perf-instructor-' || ((n - 1) % 20 + 1),
      'perf-aircraft-' || ((n - 1) % 10 + 1),
      timestamp '2025-01-01 08:00:00+00' + (n * interval '2 hours'),
      timestamp '2025-01-01 09:30:00+00' + (n * interval '2 hours'),
      'scheduled',
      now() - (n * interval '1 minute')
    FROM generate_series(1, 15000) AS n;
  `);
  await client.query("ANALYZE flights");
  await client.query("ANALYZE reservations");
}

try {
  await client.connect();
  await client.query("BEGIN");
  await seedBenchmarkVolume();

  await client.query(`
    CREATE INDEX flights_student_idx ON flights (student_id);
    CREATE INDEX flights_org_idx ON flights (organization_id);
  `);
  const before = await measure("Before composite indexes");

  await client.query(`
    DROP INDEX flights_student_idx;
    DROP INDEX flights_org_idx;
    CREATE INDEX flights_student_date_idx ON flights (student_id, flight_date DESC, created_at DESC);
    CREATE INDEX flights_org_date_idx ON flights (organization_id, flight_date DESC, created_at DESC);
    CREATE INDEX flights_instructor_date_idx ON flights (instructor_id, flight_date DESC, created_at DESC);
    CREATE INDEX flights_instructor_org_date_idx ON flights (instructor_id, organization_id, flight_date DESC, created_at DESC);
    CREATE INDEX reservations_org_instructor_start_idx ON reservations (organization_id, instructor_id, scheduled_start);
    CREATE INDEX reservations_student_start_idx ON reservations (student_id, scheduled_start);
    ANALYZE flights;
    ANALYZE reservations;
  `);
  const after = await measure("After composite indexes");

  console.log("\nSummary (p50 milliseconds)");
  console.table(
    before.map((row, index) => ({
      query: row.query,
      before: row.medianMs.toFixed(2),
      after: after[index].medianMs.toFixed(2),
      improvement: `${((1 - after[index].medianMs / row.medianMs) * 100).toFixed(1)}%`,
    })),
  );
} finally {
  await client.query("ROLLBACK").catch(() => {});
  await client.end().catch(() => {});
}