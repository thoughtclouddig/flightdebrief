import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { localIsoDate } from "@/lib/date";
import { generatePatternTrack } from "@/lib/geo";
import { analyzeMock } from "@/lib/ai/mock-analyzer";
import { DEMO_HISTORY } from "@/lib/demo/video-demo-data";

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
}

const PILOT_AIRPORT = "KFFZ";
const SCHOOL_AIRPORT = "KCHD";

function daysAgoIso(daysAgo: number): string {
  return localIsoDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));
}

/** Runs `entries` through analyzeMock() and inserts one flight+debrief per entry, same technique lib/demo/video-demo-seed.ts uses -- realistic derived content at zero AI cost. */
async function seedHistoricalFlights(
  db: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  entries: { daysAgo: number; durationMinutes: number; transcript: string }[],
  opts: {
    studentId: string;
    organizationId: string;
    aircraftId: string;
    aircraftTail: string;
    aircraftType: string;
    airport: string;
    instructorId: string | null;
    instructorName: string | null;
  },
): Promise<void> {
  let previousActionItems: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const flightId = `flight-demo-${randomUUID()}`;
    const debriefId = `debrief-demo-${randomUUID()}`;
    const flightDate = daysAgoIso(entry.daysAgo);
    const createdAt = new Date(Date.now() - entry.daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const track = generatePatternTrack(opts.airport, {
      startTime: new Date(createdAt),
      durationMinutes: entry.durationMinutes,
      seed: Math.floor(Math.random() * 1_000_000),
    });

    await db.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, debrief_status, track, created_at
       ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,'complete',$9,$10)`,
      [
        flightId,
        opts.studentId,
        opts.organizationId,
        opts.aircraftId,
        opts.airport,
        flightDate,
        entry.durationMinutes,
        opts.instructorId,
        JSON.stringify(track),
        createdAt,
      ],
    );

    const result = analyzeMock({
      transcript: entry.transcript,
      flightMeta: {
        tailNumber: opts.aircraftTail,
        aircraftType: opts.aircraftType,
        departureAirport: opts.airport,
        arrivalAirport: opts.airport,
        flightDate,
        durationMinutes: entry.durationMinutes,
        instructorName: opts.instructorName,
      },
      previousActionItems,
    });
    previousActionItems = result.actionItems;

    await db.query(
      `INSERT INTO debriefs (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with, created_at)
       VALUES ($1,$2,$3,$4,$5,'mock',$6)`,
      [debriefId, flightId, entry.transcript, Math.round(entry.durationMinutes * 0.6), JSON.stringify(result), createdAt],
    );
  }
}

export async function seedPilotDemo(expiresAt: Date): Promise<LiveDemoResult> {
  const orgId = `org-demo-pilot-${randomUUID()}`;
  const userId = `user-demo-pilot-${randomUUID()}`;
  const aircraftId = `aircraft-demo-${randomUUID()}`;
  const email = `${userId}@afterflight.demo`;
  const name = "Jordan Pilot";
  const tail = "N412FB";
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

    await client.query(
      `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id, status)
       VALUES ($1,$2,$3,'Cessna','172S',$4,$5,'active')`,
      [aircraftId, tail, aircraftType, PILOT_AIRPORT, orgId],
    );

    await seedHistoricalFlights(client, DEMO_HISTORY.slice(0, 5), {
      studentId: userId,
      organizationId: orgId,
      aircraftId,
      aircraftTail: tail,
      aircraftType,
      airport: PILOT_AIRPORT,
      instructorId: null,
      instructorName: null,
    });

    // Freeform mode needs nothing beyond a not-yet-debriefed flight -- no
    // flight_tasks/assessments/cards, confirmed against the resolver at
    // app/(product)/flights/[id]/debrief/page.tsx's freeform branch.
    const todayFlightId = `flight-demo-${randomUUID()}`;
    await client.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, debrief_status
       ) VALUES ($1,$2,$3,$4,$5,$5,$6,68,'not_started')`,
      [todayFlightId, userId, orgId, aircraftId, PILOT_AIRPORT, localIsoDate()],
    );

    await client.query("COMMIT");
    return { organizationId: orgId, loginUserId: userId, loginEmail: email, loginName: name, redirectPath: "/home" };
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
  const tail = "N287SA";
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

    await client.query(
      `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id, status)
       VALUES ($1,$2,$3,'Piper','PA-28-181',$4,$5,'active')`,
      [aircraftId, tail, aircraftType, SCHOOL_AIRPORT, orgId],
    );

    const studentIds: string[] = [];
    for (let i = 0; i < SCHOOL_STUDENTS.length; i++) {
      const student = SCHOOL_STUDENTS[i];
      const studentUserId = `user-demo-student-${randomUUID()}`;
      const studentEmail = `${studentUserId}@afterflight.demo`;
      studentIds.push(studentUserId);

      await client.query(
        `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
        [studentUserId, student.name, studentEmail],
      );
      await client.query(
        `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
         VALUES ($1,$2,$3,'student',$4)`,
        [`member-demo-${randomUUID()}`, orgId, studentUserId, student.certificateType],
      );
      await client.query(
        `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
         VALUES ($1,$2,$3,$4,true,'active')`,
        [`link-demo-${randomUUID()}`, studentUserId, instructorUserId, orgId],
      );

      // 3-4 historical flights per student, offset by index so their dates
      // don't collide with each other.
      const history = DEMO_HISTORY.slice(i, i + 4);
      await seedHistoricalFlights(client, history, {
        studentId: studentUserId,
        organizationId: orgId,
        aircraftId,
        aircraftTail: tail,
        aircraftType,
        airport: SCHOOL_AIRPORT,
        instructorId: instructorUserId,
        instructorName,
      });
    }

    // One "today" flight, guided mode, for the first student -- flight_tasks
    // + 3 pending debrief_cards so the CFI persona has a real guided debrief
    // to walk through, same shape as video-demo-seed.ts's seedTodayFlight().
    const primaryStudentId = studentIds[0];
    const todayFlightId = `flight-demo-${randomUUID()}`;
    await client.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, debrief_status
       ) VALUES ($1,$2,$3,$4,$5,$5,$6,72,$7,'not_started')`,
      [todayFlightId, primaryStudentId, orgId, aircraftId, SCHOOL_AIRPORT, localIsoDate(), instructorUserId],
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
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      await client.query(
        `INSERT INTO debrief_cards (id, flight_id, source, category, title, primary_prompt, follow_up_prompts, sort_order, status)
         VALUES ($1,$2,'standard',$3,$4,$5,$6,$7,'pending')`,
        [`card-demo-${randomUUID()}`, todayFlightId, c.category, c.title, c.prompt, c.followUps, i],
      );
    }

    await client.query("COMMIT");

    return persona === "cfi"
      ? {
          organizationId: orgId,
          loginUserId: instructorUserId,
          loginEmail: instructorEmail,
          loginName: instructorName,
          redirectPath: "/cfi/today",
        }
      : {
          organizationId: orgId,
          loginUserId: adminUserId,
          loginEmail: adminEmail,
          loginName: adminName,
          redirectPath: "/admin/overview",
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
