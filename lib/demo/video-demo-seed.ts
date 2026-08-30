import { getDb } from "@/lib/db";
import { localIsoDate } from "@/lib/date";
import { generatePatternTrack } from "@/lib/geo";
import { classifyTrainingSignals } from "@/lib/taxonomy";
import { analyzeMock } from "@/lib/ai/mock-analyzer";
import {
  DEMO_AIRCRAFT_ID,
  DEMO_AIRCRAFT_TAIL,
  DEMO_AIRCRAFT_TYPE,
  DEMO_AIRPORT,
  DEMO_CURATED_RESULT,
  DEMO_FLIGHT_ID,
  DEMO_HISTORY,
  DEMO_INSTRUCTOR_EMAIL,
  DEMO_INSTRUCTOR_ID,
  DEMO_INSTRUCTOR_HANDOVER_INDEX,
  DEMO_PRIOR_INSTRUCTOR_ID,
  DEMO_PRIOR_INSTRUCTOR_NAME,
  DEMO_PRIOR_INSTRUCTOR_EMAIL,
  DEMO_INSTRUCTOR_NAME,
  DEMO_ORG_ID,
  DEMO_ORG_NAME,
  DEMO_STUDENT_EMAIL,
  DEMO_STUDENT_ID,
  DEMO_STUDENT_NAME,
  DEMO_TODAY_DURATION_MINUTES,
} from "./video-demo-data";

const FLIGHT_TASK_ID = "flight-task-video-demo-today";
const STUDENT_ASSESSMENT_ID = "assessment-video-demo-today-student";
const INSTRUCTOR_ASSESSMENT_ID = "assessment-video-demo-today-instructor";
const CARD_IDS = ["card-video-demo-1", "card-video-demo-2", "card-video-demo-3"];

function daysAgoIso(daysAgo: number): string {
  return localIsoDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));
}

/**
 * Idempotent: every insert is ON CONFLICT (id) DO NOTHING, so calling this
 * repeatedly (e.g. every time /api/demo/enter is hit) is cheap and safe --
 * it only actually writes rows the first time.
 */
export async function ensureVideoDemoSeeded(): Promise<void> {
  const db = getDb();

  await db.query(
    "INSERT INTO organizations (id, name, kind, default_guidance_mode) VALUES ($1,$2,'school','guided') ON CONFLICT (id) DO NOTHING",
    [DEMO_ORG_ID, DEMO_ORG_NAME],
  );

  await db.query(
    "INSERT INTO users (id, name, email, profile_completed) VALUES ($1,$2,$3,true) ON CONFLICT (id) DO NOTHING",
    [DEMO_STUDENT_ID, DEMO_STUDENT_NAME, DEMO_STUDENT_EMAIL],
  );
  await db.query(
    "INSERT INTO users (id, name, email, profile_completed) VALUES ($1,$2,$3,true) ON CONFLICT (id) DO NOTHING",
    [DEMO_INSTRUCTOR_ID, DEMO_INSTRUCTOR_NAME, DEMO_INSTRUCTOR_EMAIL],
  );

  await db.query(
    `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
     VALUES ($1,$2,$3,'student','PRIVATE') ON CONFLICT (id) DO NOTHING`,
    [`member-video-demo-alex`, DEMO_ORG_ID, DEMO_STUDENT_ID],
  );
  await db.query(
    `INSERT INTO organization_members (id, organization_id, user_id, role)
     VALUES ($1,$2,$3,'instructor') ON CONFLICT (id) DO NOTHING`,
    [`member-video-demo-sarah`, DEMO_ORG_ID, DEMO_INSTRUCTOR_ID],
  );

  // The departed CFI. Still a member of the org -- a school does not delete
  // an instructor's record when they leave, and the student's earlier
  // lessons have to keep resolving to a real name.
  await db.query(
    "INSERT INTO users (id, name, email, profile_completed) VALUES ($1,$2,$3,true) ON CONFLICT (id) DO NOTHING",
    [DEMO_PRIOR_INSTRUCTOR_ID, DEMO_PRIOR_INSTRUCTOR_NAME, DEMO_PRIOR_INSTRUCTOR_EMAIL],
  );
  await db.query(
    `INSERT INTO organization_members (id, organization_id, user_id, role)
     VALUES ($1,$2,$3,'instructor') ON CONFLICT (id) DO NOTHING`,
    [`member-video-demo-marcus`, DEMO_ORG_ID, DEMO_PRIOR_INSTRUCTOR_ID],
  );
  await db.query(
    "INSERT INTO instructors (id, name, organization_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
    [DEMO_PRIOR_INSTRUCTOR_ID, DEMO_PRIOR_INSTRUCTOR_NAME, DEMO_ORG_ID],
  );

  await db.query(
    "INSERT INTO instructors (id, name, organization_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
    [DEMO_INSTRUCTOR_ID, DEMO_INSTRUCTOR_NAME, DEMO_ORG_ID],
  );

  await db.query(
    `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
     VALUES ($1,$2,$3,$4,true,'active') ON CONFLICT (id) DO NOTHING`,
    ["link-video-demo-alex-sarah", DEMO_STUDENT_ID, DEMO_INSTRUCTOR_ID, DEMO_ORG_ID],
  );

  await db.query(
    `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id, status)
     VALUES ($1,$2,$3,'Diamond','DA40 NG',$4,$5,'active') ON CONFLICT (id) DO NOTHING`,
    [DEMO_AIRCRAFT_ID, DEMO_AIRCRAFT_TAIL, DEMO_AIRCRAFT_TYPE, DEMO_AIRPORT, DEMO_ORG_ID],
  );

  // Historical flights + debriefs (Scene 8 /history, and the recurring-theme
  // logic Scene 7/9 read from). Run through the same mock analyzer the real
  // freeform flow uses -- realistic derived wentWell/needsWork per flight,
  // not hand-authored, so the arc feels organic rather than scripted.
  let previousActionItems: string[] = [];
  for (let i = 0; i < DEMO_HISTORY.length; i++) {
    const entry = DEMO_HISTORY[i];
    const flightId = `flight-video-demo-history-${i}`;
    // DEMO_HISTORY is ordered oldest-first, so the early indices are the
    // departed CFI's lessons. This is what makes the recurring theme cross
    // an instructor change instead of sitting under one name.
    const flightInstructorId = i < DEMO_INSTRUCTOR_HANDOVER_INDEX ? DEMO_PRIOR_INSTRUCTOR_ID : DEMO_INSTRUCTOR_ID;
    const debriefId = `debrief-video-demo-history-${i}`;
    const flightDate = daysAgoIso(entry.daysAgo);
    const createdAt = new Date(Date.now() - entry.daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const track = generatePatternTrack(DEMO_AIRPORT, {
      startTime: new Date(createdAt),
      durationMinutes: entry.durationMinutes,
      seed: 900 + i,
    });

    await db.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, debrief_status, track, created_at
       ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,'complete',$9,$10) ON CONFLICT (id) DO NOTHING`,
      [
        flightId, DEMO_STUDENT_ID, DEMO_ORG_ID, DEMO_AIRCRAFT_ID, DEMO_AIRPORT,
        flightDate, entry.durationMinutes, flightInstructorId, JSON.stringify(track), createdAt,
      ],
    );

    const result = analyzeMock({
      transcript: entry.transcript,
      flightMeta: {
        tailNumber: DEMO_AIRCRAFT_TAIL,
        aircraftType: DEMO_AIRCRAFT_TYPE,
        departureAirport: DEMO_AIRPORT,
        arrivalAirport: DEMO_AIRPORT,
        flightDate,
        durationMinutes: entry.durationMinutes,
        instructorName: DEMO_INSTRUCTOR_NAME,
      },
      previousActionItems,
    });
    previousActionItems = result.actionItems;

    await db.query(
      `INSERT INTO debriefs (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with, created_at)
       VALUES ($1,$2,$3,$4,$5,'mock',$6) ON CONFLICT (id) DO NOTHING`,
      [debriefId, flightId, entry.transcript, Math.round(entry.durationMinutes * 0.6), JSON.stringify(result), createdAt],
    );

    // Training signals, the same way app/api/debrief/analyze/route.ts writes
    // them for a real debrief. Without these the seeded history produces no
    // recurring theme at all -- and the recurrence view, which is the whole
    // point of a two-instructor demo, renders empty on a freshly reset demo.
    // instructor_id carries the CFI who actually flew that lesson, which is
    // what makes the cross-instructor count real rather than staged.
    const drafts = [
      ...classifyTrainingSignals(result),
      ...(entry.guaranteedNeedsWork ?? []).map((g) => ({
        category: g.category,
        skill: g.skill,
        status: "NEEDS_COACHING" as const,
        source: "STUDENT_AND_INSTRUCTOR" as const,
        statement: g.statement,
      })),
    ];
    for (const [n, draft] of drafts.entries()) {
      await db.query(
        `INSERT INTO training_signals (
           id, organization_id, student_id, instructor_id, aircraft_id, flight_id, debrief_id,
           flight_date, category, skill, status, source, statement, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
        [
          `signal-video-demo-${i}-${n}`,
          DEMO_ORG_ID,
          DEMO_STUDENT_ID,
          flightInstructorId,
          DEMO_AIRCRAFT_ID,
          flightId,
          debriefId,
          flightDate,
          draft.category,
          draft.skill,
          draft.status,
          draft.source,
          draft.statement,
          createdAt,
        ],
      );
    }
  }

  await seedTodayFlight(DEMO_STUDENT_ID);
}

/** The undebriefed "today" flight scenes 1-6 walk through -- split out so resetVideoDemo can recreate just this part. */
async function seedTodayFlight(studentId: string): Promise<void> {
  const db = getDb();
  const flightDate = localIsoDate(new Date());

  await db.query(
    `INSERT INTO flights (
       id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
       flight_date, duration_minutes, instructor_id, debrief_status
     ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,'not_started') ON CONFLICT (id) DO NOTHING`,
    [DEMO_FLIGHT_ID, studentId, DEMO_ORG_ID, DEMO_AIRCRAFT_ID, DEMO_AIRPORT, flightDate, DEMO_TODAY_DURATION_MINUTES, DEMO_INSTRUCTOR_ID],
  );

  // One flight_task row is all the guided-debrief resolver requires to exist
  // (app/(product)/flights/[id]/debrief/page.tsx) -- the demo cards below
  // don't reference it (flightTaskId is nullable), so its content doesn't
  // otherwise matter.
  await db.query(
    `INSERT INTO flight_tasks (id, flight_id, task_code, label, source, sort_order)
     VALUES ($1,$2,'LANDINGS','Traffic Pattern & Landings','instructor_selected',0) ON CONFLICT (id) DO NOTHING`,
    [FLIGHT_TASK_ID, DEMO_FLIGHT_ID],
  );

  await db.query(
    `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id, status, submitted_at)
     VALUES ($1,$2,'student',$3,'submitted',now()) ON CONFLICT (id) DO NOTHING`,
    [STUDENT_ASSESSMENT_ID, DEMO_FLIGHT_ID, studentId],
  );
  await db.query(
    `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id, status, submitted_at)
     VALUES ($1,$2,'instructor',$3,'submitted',now()) ON CONFLICT (id) DO NOTHING`,
    [INSTRUCTOR_ASSESSMENT_ID, DEMO_FLIGHT_ID, DEMO_INSTRUCTOR_ID],
  );

  // Three cards for Scene 3, written specific to this lesson's actual theme
  // (traffic patterns and landings, building toward the curated
  // stabilized-approach/flare/centerline result in DEMO_CURATED_RESULT) --
  // not generic FAA-template boilerplate.
  const cards: { category: string; title: string; prompt: string; followUps: string[] }[] = [
    {
      category: "KEY_TASK",
      title: "Approach Speed Control",
      prompt: "Walk through your approach speed on today's landings -- were you on-speed by the time you turned final?",
      followUps: ["Where in the pattern did you get configured -- downwind, base, or final?"],
    },
    {
      category: "STRENGTHS",
      title: "What Went Well",
      prompt: "Airspeed control and checklist flow both looked sharp today -- what changed from last time?",
      followUps: ["How did the radio calls go, including the runway change from tower?"],
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
    await db.query(
      `INSERT INTO debrief_cards (id, flight_id, source, category, title, primary_prompt, follow_up_prompts, sort_order, status)
       VALUES ($1,$2,'standard',$3,$4,$5,$6,$7,'pending') ON CONFLICT (id) DO NOTHING`,
      [CARD_IDS[i], DEMO_FLIGHT_ID, c.category, c.title, c.prompt, c.followUps, i],
    );
  }
}

/**
 * Deletes just today's flight (cascades to its flight_tasks/assessments/
 * cards/debrief/pending-transcript via ON DELETE CASCADE) and recreates it
 * fresh -- restores the pre-debrief state for scenes 1-6 without touching
 * the historical flights scenes 8/9 depend on, so a reset between takes is
 * fast and doesn't reseed 9 flights every time.
 */
export async function resetVideoDemoFlight(): Promise<void> {
  const db = getDb();
  await ensureVideoDemoSeeded(); // safety net if the whole demo was never seeded yet
  await db.query("DELETE FROM flights WHERE id = $1", [DEMO_FLIGHT_ID]);
  await seedTodayFlight(DEMO_STUDENT_ID);
}

export { DEMO_CURATED_RESULT };
