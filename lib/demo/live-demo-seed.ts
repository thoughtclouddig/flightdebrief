import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getRepository } from "@/lib/data";
import { localIsoDate } from "@/lib/date";
import { analyzeMock } from "@/lib/ai/mock-analyzer";
import { classifyTrainingSignals } from "@/lib/taxonomy";
import { evaluateAndAwardMilestones } from "@/lib/milestones";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { DEMO_HISTORY } from "@/lib/demo/video-demo-data";
import { REAL_DEMO_FLIGHTS } from "@/lib/demo/real-flight-fixtures";
import type { StructuredDebrief, TrackPosition } from "@/lib/types";

/**
 * Public "try it live" demo -- distinct from lib/demo/video-demo-seed.ts
 * (fixed ids, ON CONFLICT DO NOTHING, internal-only "Video Demo Mode" used to
 * record the marketing video). Every call here generates a fresh, uniquely-id
 * org + users + data so concurrent visitors never collide, and never reuses
 * or mutates video-demo-seed.ts's rows. See app/api/demo/start/route.ts for
 * the entry point and the plan this implements.
 */

export interface LiveDemoResult {
  organizationId: string;
  loginUserId: string;
  loginEmail: string;
  loginName: string;
  redirectPath: "/home" | "/cfi/today" | "/admin/overview";
  /** One-line, persona-specific orientation shown in the LiveDemoBanner on first landing -- see app/api/demo/start/route.ts. */
  hint: string;
}

const PILOT_AIRPORT = "KFFZ";
const SCHOOL_AIRPORT = "KCHD";

/** `aircraft.tail_number` is globally unique, so use a large N-number-shaped namespace instead of the previous 900-number pool. */
function randomTailNumber(prefix: string): string {
  const alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let entropy = BigInt(`0x${randomUUID().replaceAll("-", "").slice(0, 12)}`);
  let suffix = "";
  for (let index = 0; index < 4; index++) {
    suffix = alphabet[Number(entropy % BigInt(alphabet.length))] + suffix;
    entropy /= BigInt(alphabet.length);
  }
  return `N${prefix}${suffix}`;
}

interface HistoricalFlightRecord {
  flightId: string;
  debriefId: string;
  studentId: string;
  organizationId: string;
  instructorId: string | null;
  aircraftId: string;
  flightDate: string;
  structured: StructuredDebrief;
}

function buildInsertRows(rows: readonly (readonly unknown[])[]): { placeholders: string; values: unknown[] } {
  const values: unknown[] = [];
  const placeholders = rows
    .map((row) => {
      const start = values.length;
      values.push(...row);
      return `(${row.map((_, index) => `$${start + index + 1}`).join(",")})`;
    })
    .join(",");
  return { placeholders, values };
}

async function insertDemoAircraft(
  db: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  opts: {
    id: string;
    prefix: string;
    type: string;
    make: string;
    model: string;
    homeAirport: string;
    organizationId: string;
  },
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const tail = randomTailNumber(opts.prefix);
    const result = (await db.query(
      `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [opts.id, tail, opts.type, opts.make, opts.model, opts.homeAirport, opts.organizationId],
    )) as { rowCount: number };
    if (result.rowCount === 1) return tail;
  }
  throw new Error("Could not allocate a unique demo aircraft tail number.");
}

/**
 * Rotating cursor over REAL_DEMO_FLIGHTS (lib/demo/real-flight-fixtures.ts,
 * fetched once from FR24 -- see scripts/fetch-real-tracks.mjs) so a single
 * demo org's several historical flights don't all draw the same real flight,
 * and different orgs/visitors don't all draw flights in the same order.
 * Wraps around if more flights are needed than were fetched.
 */
let realFlightCursor = Math.floor(Math.random() * REAL_DEMO_FLIGHTS.length);
function nextRealFlight() {
  const flight = REAL_DEMO_FLIGHTS[realFlightCursor % REAL_DEMO_FLIGHTS.length];
  realFlightCursor++;
  return flight;
}

/** Reconstructs timestamps for a real track's points (FR24's raw points are already time-ordered, but scripts/fetch-real-tracks.mjs strips their absolute timestamps) by spreading them evenly across the flight's real duration starting at `startIso`. */
function withTimestamps(track: { lat: number; lon: number; altitudeFt?: number; groundSpeedKt?: number }[], startIso: string, durationMinutes: number): TrackPosition[] {
  const startMs = new Date(startIso).getTime();
  const totalMs = durationMinutes * 60 * 1000;
  return track.map((p, i) => ({
    ...p,
    timestamp: new Date(startMs + (i / Math.max(1, track.length - 1)) * totalMs).toISOString(),
  }));
}

/**
 * Inserts one flight+debrief per transcript, pairing each with a REAL flight
 * (route, date, duration, GPS track) drawn from REAL_DEMO_FLIGHTS -- only the
 * debrief narrative itself is fabricated (analyzeMock against a scripted
 * transcript), since no real audio exists for these real flights. The
 * aircraft identity (tail/type) stays the org's own seeded aircraft rather
 * than the real flight's actual registration, both to avoid colliding with
 * `aircraft_tail_number_idx`'s global UNIQUE constraint across concurrent
 * demo sessions drawing from the same small real-flight pool, and because
 * attributing a real operator's real aircraft to this fictional flight
 * school would be misleading -- the flown geometry is real, the airplane
 * "flying" it in the demo is not. Returns one record per transcript so the
 * caller can run the same post-analysis side effects the real
 * app/api/debrief/analyze/route.ts does (training items, training signals,
 * milestones) via seedDerivedContent() once these rows are committed --
 * those side effects go through the Repository layer (a different DB
 * connection than this function's transactional `db` param), so they can
 * only safely run after COMMIT, never inline here.
 */
async function seedHistoricalFlights(
  db: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  transcripts: string[],
  opts: {
    studentId: string;
    organizationId: string;
    aircraftId: string;
    aircraftTail: string;
    aircraftType: string;
    instructorId: string | null;
    instructorName: string | null;
  },
): Promise<HistoricalFlightRecord[]> {
  const records: HistoricalFlightRecord[] = [];
  const flightRows: unknown[][] = [];
  const debriefRows: unknown[][] = [];
  let previousActionItems: string[] = [];

  // Oldest-first so the narrative arc (transcripts are written as a
  // progression) lines up with real chronological order.
  const realFlights = transcripts.map(() => nextRealFlight()).sort((a, b) => a.takeoffIso.localeCompare(b.takeoffIso));

  for (let i = 0; i < transcripts.length; i++) {
    const transcript = transcripts[i];
    const real = realFlights[i];
    const flightId = `flight-demo-${randomUUID()}`;
    const debriefId = `debrief-demo-${randomUUID()}`;
    const flightDate = real.takeoffIso.slice(0, 10);
    const track = withTimestamps(real.track, real.takeoffIso, real.durationMinutes);

    const result = analyzeMock({
      transcript,
      flightMeta: {
        tailNumber: opts.aircraftTail,
        aircraftType: opts.aircraftType,
        departureAirport: real.departureAirport,
        arrivalAirport: real.arrivalAirport,
        flightDate,
        durationMinutes: real.durationMinutes,
        instructorName: opts.instructorName,
      },
      previousActionItems,
    });
    previousActionItems = result.actionItems;

    flightRows.push([
      flightId,
      opts.studentId,
      opts.organizationId,
      opts.aircraftId,
      real.departureAirport,
      real.arrivalAirport,
      flightDate,
      real.durationMinutes,
      opts.instructorId,
      "complete",
      JSON.stringify(track),
      real.takeoffIso,
    ]);
    debriefRows.push([
      debriefId,
      flightId,
      transcript,
      Math.round(real.durationMinutes * 0.6),
      JSON.stringify(result),
      "mock",
      real.takeoffIso,
    ]);

    records.push({
      flightId,
      debriefId,
      studentId: opts.studentId,
      organizationId: opts.organizationId,
      instructorId: opts.instructorId,
      aircraftId: opts.aircraftId,
      flightDate,
      structured: result,
    });
  }

  const flightsInsert = buildInsertRows(flightRows);
  await db.query(
    `INSERT INTO flights (
       id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
       flight_date, duration_minutes, instructor_id, debrief_status, track, created_at
     ) VALUES ${flightsInsert.placeholders}`,
    flightsInsert.values,
  );

  const debriefsInsert = buildInsertRows(debriefRows);
  await db.query(
    `INSERT INTO debriefs (
       id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with, created_at
     ) VALUES ${debriefsInsert.placeholders}`,
    debriefsInsert.values,
  );

  return records;
}

/**
 * Same post-analysis pipeline app/api/debrief/analyze/route.ts runs for a
 * real completed debrief -- training items (Action Items), training signals
 * (skill progression on /progress), and milestone/streak evaluation --
 * applied here to seeded historical flights so a demo account looks like it
 * actually has training history behind it, not just a bare flight list. Must
 * run after the flights/debriefs themselves are committed (see
 * seedHistoricalFlights's doc comment), and in chronological order so
 * evaluateAndAwardMilestones sees a realistic progression rather than
 * everything already existing at once.
 *
 * Deliberately skips autoResolveActionItems, unlike the real analyze route --
 * DEMO_HISTORY's transcripts are written as one coherent "this used to be a
 * problem, now it's fixed" narrative arc, so running it here would close out
 * nearly every earlier flight's open items by the end of the sequence,
 * leaving the demo's Action Items/Progress pages looking empty. The point of
 * this seed data is to look actively in-use, not to exactly mirror
 * production's resolution behavior.
 *
 * Runs each record's training-items/training-signals creation in parallel
 * (they're independent of each other -- there's no cross-record read here
 * anymore, unlike autoResolveActionItems), and calls
 * evaluateAndAwardMilestones exactly once per distinct student rather than
 * once per record: every historical flight is already committed by this
 * point, so for a given student, milestone/streak evaluation recomputes the
 * exact same end state whichever of their own flights "triggers" it --
 * calling it once per flight just repeats the same listFlights()+evaluate
 * work for no different outcome (CFI/School demo seeds several students at
 * once, each with several flights, so this still means one call per student,
 * not one overall). This matters for /api/demo/start's response time, which
 * is otherwise a long chain of sequential round trips to a remote database.
 */
async function seedDerivedContent(records: HistoricalFlightRecord[]): Promise<void> {
  if (records.length === 0) return;
  const repo = getRepository();

  const trainingItems = records.flatMap((record) => [
    ...record.structured.needsWork.map((description) => ({
      flightId: record.flightId,
      debriefId: record.debriefId,
      category: "keep_working_on" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
    })),
    ...record.structured.actionItems.map((description) => ({
      flightId: record.flightId,
      debriefId: record.debriefId,
      category: "before_next_flight" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
    })),
  ]);
  const trainingSignals = records.flatMap((record) =>
    classifyTrainingSignals(record.structured).map((draft) => ({
      ...draft,
      organizationId: record.organizationId,
      studentId: record.studentId,
      instructorId: record.instructorId,
      aircraftId: record.aircraftId,
      flightId: record.flightId,
      debriefId: record.debriefId,
      flightDate: record.flightDate,
      dismissed: false,
    })),
  );

  await Promise.all(
    [
      trainingItems.length > 0 ? repo.createTrainingItems(trainingItems) : Promise.resolve([]),
      trainingSignals.length > 0 ? repo.createTrainingSignals(trainingSignals) : Promise.resolve([]),
    ],
  );

  const lastRecordPerStudent = new Map<string, HistoricalFlightRecord>();
  for (const record of records) lastRecordPerStudent.set(record.studentId, record);
  await Promise.all(
    Array.from(lastRecordPerStudent.values()).map((record) =>
      evaluateAndAwardMilestones(repo, record.studentId, record.flightId),
    ),
  );
}

/**
 * Deterministically forces one student's last 3 historical flights to share
 * a single recurring skill deficiency -- lib/training-insights.ts's
 * recurringStudentIssues (same skill NEEDS_COACHING in 3+ of the student's
 * last 4 debriefs) and objectivesCarriedForward (same item text on 3+
 * *consecutive* completed flights) both need an exact repeat, which
 * DEMO_HISTORY's naturally-varying, improving narrative -- paraphrased
 * slightly differently each flight -- doesn't reliably produce word-for-word
 * via the mock analyzer. Without this, the School/CFI demo's Insights page
 * reads 0 for both cards even though Most Common Training Issues (a looser,
 * latest-signal-only metric) is already populated.
 */
async function seedRecurringInsightSignal(records: HistoricalFlightRecord[]): Promise<void> {
  const target = records.slice(-3);
  if (target.length < 3) return;
  const repo = getRepository();
  const description = "Practice crosswind correction technique on final";
  const trainingItems = target.map((record) => ({
    flightId: record.flightId,
    debriefId: record.debriefId,
    category: "before_next_flight" as const,
    description,
    done: false,
    completedAt: null,
    visibility: "shared" as const,
  }));
  const trainingSignals = target.map((record) => ({
    organizationId: record.organizationId,
    studentId: record.studentId,
    instructorId: record.instructorId,
    aircraftId: record.aircraftId,
    flightId: record.flightId,
    debriefId: record.debriefId,
    flightDate: record.flightDate,
    category: "LANDINGS" as const,
    skill: "CROSSWIND_LANDING" as const,
    status: "NEEDS_COACHING" as const,
    source: "STUDENT_AND_INSTRUCTOR" as const,
    statement: "Still working on tracking centerline through crosswind landings.",
    dismissed: false,
  }));

  await Promise.all(
    [repo.createTrainingItems(trainingItems), repo.createTrainingSignals(trainingSignals)],
  );
}

/** Assigns one open (not-yet-completed) radio practice scenario so the demo's Home page/practice section isn't empty -- picks the first RADIO_COMMUNICATIONS scenario, matching the "radio confidence" thread already running through DEMO_HISTORY's transcripts. */
async function seedRadioPractice(organizationId: string, studentId: string, assignedBy: string | null): Promise<void> {
  const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.skill === "RADIO_COMMUNICATIONS");
  if (!scenario) return;
  await getRepository().createRadioPracticeAssignment({ organizationId, studentId, assignedBy, scenarioId: scenario.id });
}

export async function seedPilotDemo(expiresAt: Date): Promise<LiveDemoResult> {
  const orgId = `org-demo-pilot-${randomUUID()}`;
  const userId = `user-demo-pilot-${randomUUID()}`;
  const aircraftId = `aircraft-demo-${randomUUID()}`;
  const email = `${userId}@afterflight.demo`;
  const name = "Jordan Pilot";
  const aircraftType = "Cessna 172S";

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO organizations (id, name, kind, default_guidance_mode, demo_expires_at)
       VALUES ($1,$2,'individual','freeform',$3)`,
      [orgId, `${name}'s Flights`, expiresAt.toISOString()],
    );

    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [userId, name, email],
    );

    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
       VALUES ($1,$2,$3,'student','PRIVATE')`,
      [`member-demo-${randomUUID()}`, orgId, userId],
    );

    const tail = await insertDemoAircraft(client, {
      id: aircraftId,
      prefix: "4",
      type: aircraftType,
      make: "Cessna",
      model: "172S",
      homeAirport: PILOT_AIRPORT,
      organizationId: orgId,
    });

    // Last 5, not first 5 -- DEMO_HISTORY's transcripts are a deliberate
    // narrative arc that only converges on one persistent theme (flare/
    // centerline control) toward the end (see lib/demo/video-demo-data.ts's
    // own doc comment); the early entries each describe a different evolving
    // issue. Progress's recurring-themes card only surfaces a theme once the
    // same skill is flagged in 2+ of the last 4 completed flights, so the
    // early slice never actually triggered it.
    const historicalRecords = await seedHistoricalFlights(
      client,
      DEMO_HISTORY.slice(-5).map((e) => e.transcript),
      {
        studentId: userId,
        organizationId: orgId,
        aircraftId,
        aircraftTail: tail,
        aircraftType,
        instructorId: null,
        instructorName: null,
      },
    );

    // Freeform mode needs nothing beyond a not-yet-debriefed flight -- no
    // flight_tasks/assessments/cards, confirmed against the resolver at
    // app/(product)/flights/[id]/debrief/page.tsx's freeform branch. Still
    // gets a real route/duration/track (re-dated to today) so the flight
    // detail page never shows the "no track data available" empty state --
    // the whole demo should read as fully populated, not partially seeded.
    const todayReal = nextRealFlight();
    const todayFlightId = `flight-demo-${randomUUID()}`;
    const todayIso = new Date().toISOString();
    await client.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, debrief_status, track
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'not_started',$9)`,
      [
        todayFlightId,
        userId,
        orgId,
        aircraftId,
        todayReal.departureAirport,
        todayReal.arrivalAirport,
        localIsoDate(),
        todayReal.durationMinutes,
        JSON.stringify(withTimestamps(todayReal.track, todayIso, todayReal.durationMinutes)),
      ],
    );

    await client.query("COMMIT");
    await Promise.all([seedDerivedContent(historicalRecords), seedRadioPractice(orgId, userId, null)]);
    return {
      organizationId: orgId,
      loginUserId: userId,
      loginEmail: email,
      loginName: name,
      redirectPath: "/home",
      hint: "This is your own account -- log a new flight under Flights and debrief it yourself, no CFI needed.",
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

const SCHOOL_STUDENTS = [
  { name: "Riley Student", certificateType: "PRIVATE" as const },
  { name: "Sam Trainee", certificateType: "PRIVATE" as const },
  { name: "Casey Learner", certificateType: null },
];

export async function seedCfiSchoolDemo(persona: "cfi" | "school", expiresAt: Date): Promise<LiveDemoResult> {
  const orgId = `org-demo-school-${randomUUID()}`;
  const instructorUserId = `user-demo-instructor-${randomUUID()}`;
  const adminUserId = `user-demo-admin-${randomUUID()}`;
  const aircraftId = `aircraft-demo-${randomUUID()}`;
  const instructorEmail = `${instructorUserId}@afterflight.demo`;
  const adminEmail = `${adminUserId}@afterflight.demo`;
  const instructorName = "Morgan CFI";
  const adminName = "Taylor Admin";
  const aircraftType = "Piper PA-28-181";

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    await client.query(`INSERT INTO organizations (id, name, kind, demo_expires_at) VALUES ($1,$2,'school',$3)`, [
      orgId,
      "Skyline Flight Academy",
      expiresAt.toISOString(),
    ]);

    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [instructorUserId, instructorName, instructorEmail],
    );
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [adminUserId, adminName, adminEmail],
    );
    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ($1,$2,$3,'instructor')`,
      [`member-demo-${randomUUID()}`, orgId, instructorUserId],
    );
    await client.query(`INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ($1,$2,$3,'admin')`, [
      `member-demo-${randomUUID()}`,
      orgId,
      adminUserId,
    ]);

    await client.query(`INSERT INTO instructors (id, name, organization_id) VALUES ($1,$2,$3)`, [
      instructorUserId,
      instructorName,
      orgId,
    ]);

    const tail = await insertDemoAircraft(client, {
      id: aircraftId,
      prefix: "2",
      type: aircraftType,
      make: "Piper",
      model: "PA-28-181",
      homeAirport: SCHOOL_AIRPORT,
      organizationId: orgId,
    });

    const students = SCHOOL_STUDENTS.map((student) => {
      const userId = `user-demo-student-${randomUUID()}`;
      return {
        ...student,
        userId,
        email: `${userId}@afterflight.demo`,
      };
    });
    const studentIds = students.map((student) => student.userId);
    const historicalRecords: HistoricalFlightRecord[] = [];
    const usersInsert = buildInsertRows(
      students.map((student) => [student.userId, student.name, student.email, student.email, true]),
    );
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed)
       VALUES ${usersInsert.placeholders}`,
      usersInsert.values,
    );

    const membersInsert = buildInsertRows(
      students.map((student) => [
        `member-demo-${randomUUID()}`,
        orgId,
        student.userId,
        "student",
        student.certificateType,
      ]),
    );
    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
       VALUES ${membersInsert.placeholders}`,
      membersInsert.values,
    );

    const linksInsert = buildInsertRows(
      students.map((student) => [
        `link-demo-${randomUUID()}`,
        student.userId,
        instructorUserId,
        orgId,
        true,
        "active",
      ]),
    );
    await client.query(
      `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
       VALUES ${linksInsert.placeholders}`,
      linksInsert.values,
    );

    for (const student of students) {

      // Last 4 entries for every student -- same reasoning as the pilot
      // persona above (see its comment): that's where DEMO_HISTORY's
      // narrative actually converges on one repeated skill, which is what
      // Progress's recurring-themes card needs to ever populate.
      const transcripts = DEMO_HISTORY.slice(-4).map((e) => e.transcript);
      historicalRecords.push(
        ...(await seedHistoricalFlights(client, transcripts, {
          studentId: student.userId,
          organizationId: orgId,
          aircraftId,
          aircraftTail: tail,
          aircraftType,
          instructorId: instructorUserId,
          instructorName,
        })),
      );
    }

    // One "today" flight, guided mode, for the first student -- flight_tasks
    // + 3 pending debrief_cards so the CFI persona has a real guided debrief
    // to walk through, same shape as video-demo-seed.ts's seedTodayFlight().
    const primaryStudentId = studentIds[0];

    // A today-scheduled reservation is what actually populates the CFI
    // Today page's "Today's Students" section (app/(product)/cfi/today/
    // page.tsx filters reservations by status='scheduled' + today's date) --
    // without this row the roster below (Debrief In Progress) is the only
    // thing that shows, and "Today's Students" reads empty.
    const now = new Date();
    const scheduledStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const scheduledEnd = new Date(now.getTime() - 60 * 60 * 1000);
    await client.query(
      `INSERT INTO reservations (id, organization_id, student_id, instructor_id, aircraft_id, scheduled_start, scheduled_end, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled')`,
      [
        `reservation-demo-${randomUUID()}`,
        orgId,
        primaryStudentId,
        instructorUserId,
        aircraftId,
        scheduledStart.toISOString(),
        scheduledEnd.toISOString(),
      ],
    );

    // Real route/duration/track (re-dated to this morning, matching the
    // reservation above) so this flight's map never shows the "no track
    // data available" empty state either -- see the same treatment on the
    // pilot persona's today flight, above.
    const todayReal = nextRealFlight();
    const todayFlightId = `flight-demo-${randomUUID()}`;
    await client.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, debrief_status, track
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'not_started',$10)`,
      [
        todayFlightId,
        primaryStudentId,
        orgId,
        aircraftId,
        todayReal.departureAirport,
        todayReal.arrivalAirport,
        localIsoDate(),
        todayReal.durationMinutes,
        instructorUserId,
        JSON.stringify(withTimestamps(todayReal.track, scheduledStart.toISOString(), todayReal.durationMinutes)),
      ],
    );

    const flightTaskId = `flight-task-demo-${randomUUID()}`;
    await client.query(
      `INSERT INTO flight_tasks (id, flight_id, task_code, label, source, sort_order)
       VALUES ($1,$2,'LANDINGS','Traffic Pattern & Landings','instructor_selected',0)`,
      [flightTaskId, todayFlightId],
    );
    await client.query(
      `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id, status, submitted_at)
       VALUES ($1,$2,'student',$3,'submitted',now())`,
      [`assessment-demo-${randomUUID()}`, todayFlightId, primaryStudentId],
    );
    await client.query(
      `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id, status, submitted_at)
       VALUES ($1,$2,'instructor',$3,'submitted',now())`,
      [`assessment-demo-${randomUUID()}`, todayFlightId, instructorUserId],
    );

    const cards: { category: string; title: string; prompt: string; followUps: string[] }[] = [
      {
        category: "KEY_TASK",
        title: "Approach Speed Control",
        prompt: "Walk through the approach speed on today's landings -- on-speed by the time you turned final?",
        followUps: ["Where in the pattern did you get configured -- downwind, base, or final?"],
      },
      {
        category: "STRENGTHS",
        title: "What Went Well",
        prompt: "Airspeed control and checklist flow both looked sharp today -- what changed from last time?",
        followUps: ["How did the radio calls go?"],
      },
      {
        category: "IMPROVEMENT",
        title: "Flare and Centerline",
        prompt: "A couple of those landings ballooned a little in the flare -- what were you seeing out front when that happened?",
        followUps: ["What's one adjustment to hold centerline better through rollout?"],
      },
    ];
    const cardsInsert = buildInsertRows(
      cards.map((card, index) => [
        `card-demo-${randomUUID()}`,
        todayFlightId,
        "standard",
        card.category,
        card.title,
        card.prompt,
        card.followUps,
        index,
        "pending",
      ]),
    );
    await client.query(
      `INSERT INTO debrief_cards (
         id, flight_id, source, category, title, primary_prompt, follow_up_prompts, sort_order, status
       ) VALUES ${cardsInsert.placeholders}`,
      cardsInsert.values,
    );

    await client.query("COMMIT");
    await Promise.all([
      seedDerivedContent(historicalRecords),
      seedRecurringInsightSignal(historicalRecords.filter((r) => r.studentId === primaryStudentId)),
      ...studentIds.map((studentId) => seedRadioPractice(orgId, studentId, instructorUserId)),
    ]);

    return persona === "cfi"
      ? {
          organizationId: orgId,
          loginUserId: instructorUserId,
          loginEmail: instructorEmail,
          loginName: instructorName,
          redirectPath: "/cfi/today",
          hint: `Riley Student flew this morning and is ready to debrief -- open "Debrief In Progress" to try the guided flow.`,
        }
      : {
          organizationId: orgId,
          loginUserId: adminUserId,
          loginEmail: adminEmail,
          loginName: adminName,
          redirectPath: "/admin/overview",
          hint: "This is the same roster as the CFI demo, from the school admin's view -- check Students or Insights.",
        };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Lazy cleanup: called from app/api/demo/start/route.ts before every new
 * provision, not on a schedule -- this codebase has no job scheduler.
 * Deletion order matters (see db/schema.sql's demo_expires_at comment):
 * users first (cascades flights -> debriefs/training_items/flight_tasks/
 * debrief_assessments/debrief_cards/milestones/etc.), then aircraft (safe
 * once no flights reference them -- flights.aircraft_id is ON DELETE
 * RESTRICT), then instructors (organization_id is ON DELETE SET NULL, not
 * CASCADE, so they'd otherwise be orphaned), then the organizations rows
 * themselves (cascades any remaining org-scoped rows).
 */
export async function cleanupExpiredDemoOrgs(now: Date = new Date()): Promise<number> {
  const db = getDb();

  const { rows: orgRows } = (await db.query("SELECT id FROM organizations WHERE demo_expires_at IS NOT NULL AND demo_expires_at < $1", [
    now.toISOString(),
  ])) as { rows: { id: string }[] };
  if (orgRows.length === 0) return 0;
  const orgIds = orgRows.map((r) => r.id);

  const { rows: userRows } = (await db.query("SELECT user_id FROM organization_members WHERE organization_id = ANY($1)", [
    orgIds,
  ])) as { rows: { user_id: string }[] };
  const userIds = userRows.map((r) => r.user_id);

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (userIds.length > 0) {
      await client.query("DELETE FROM users WHERE id = ANY($1)", [userIds]);
    }
    await client.query("DELETE FROM aircraft WHERE organization_id = ANY($1)", [orgIds]);
    await client.query("DELETE FROM instructors WHERE organization_id = ANY($1)", [orgIds]);
    await client.query("DELETE FROM organizations WHERE id = ANY($1)", [orgIds]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  return orgIds.length;
}
