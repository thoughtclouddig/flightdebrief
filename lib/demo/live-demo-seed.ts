import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getRepository } from "@/lib/data";
import { buildDebriefNarration } from "@/lib/debrief-narration";
import { synthesizeSpeech } from "@/lib/deepgram-tts";
import { toPilotSpeak } from "@/lib/narration";
import { audioCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio-cache";
import { DEFAULT_TTS_VOICE } from "@/lib/tts-voices";
import { localIsoDate } from "@/lib/date";
import { analyzeMock } from "@/lib/ai/mock-analyzer";
import { classifyTrainingSignals } from "@/lib/taxonomy";
import { evaluateAndAwardMilestones } from "@/lib/milestones";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import {
  DEMO_HISTORY,
  DEMO_INSTRUCTOR_HANDOVER_INDEX,
  DEMO_INSTRUCTOR_NAME,
  DEMO_PRIOR_INSTRUCTOR_NAME,
} from "@/lib/demo/video-demo-data";
import { completeDemoFlights } from "@/lib/demo/real-flight-fixtures";
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
// Only tracks that begin and end on the ground. Three fixtures stop on final
// where ADS-B coverage ends, and drawn on a map they read as an airplane
// ending in a neighbourhood. See isCompleteTrack().
const DEMO_FLIGHTS = completeDemoFlights();
let realFlightCursor = Math.floor(Math.random() * DEMO_FLIGHTS.length);
function nextRealFlight() {
  const flight = DEMO_FLIGHTS[realFlightCursor % DEMO_FLIGHTS.length];
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
  entries: { transcript: string; instructorId: string | null; instructorName: string | null }[],
  opts: {
    studentId: string;
    organizationId: string;
    aircraftId: string;
    aircraftTail: string;
    aircraftType: string;
  },
): Promise<HistoricalFlightRecord[]> {
  const records: HistoricalFlightRecord[] = [];
  const flightRows: unknown[][] = [];
  const debriefRows: unknown[][] = [];
  let previousActionItems: string[] = [];

  // Oldest-first so the narrative arc (transcripts are written as a
  // progression) lines up with real chronological order.
  const realFlights = entries.map(() => nextRealFlight()).sort((a, b) => a.takeoffIso.localeCompare(b.takeoffIso));

  // instructorId/instructorName travel WITH each transcript now, not as one
  // opts value for the whole call. That is what lets a single call seed a
  // history that crosses an instructor handover -- entries[i].instructorId
  // can differ partway through -- while previousActionItems keeps threading
  // continuously across that change, the same way video-demo-seed.ts's own
  // single-loop implementation does. Calling this twice (once per
  // instructor) would have reset that thread exactly at the handover.
  for (let i = 0; i < entries.length; i++) {
    const { transcript, instructorId, instructorName } = entries[i];
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
        instructorName,
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
      instructorId,
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
      instructorId,
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
/**
 * Renders the recap audio for the debrief each persona will actually open.
 *
 * The live product never pays this in front of a user: analyze fires
 * prewarmDebriefAudio the moment a debrief is ready, so the first "Listen"
 * click is a cache hit. Seeded debriefs skip analyze entirely -- they are
 * written straight to the database -- so nothing warms them and the first
 * visitor to press Listen waits ten to fifteen seconds on Deepgram. On a demo
 * that is the difference between "this is slick" and "this is broken".
 *
 * Only the LATEST debrief per student, and only the default voice. That is
 * what the home page and results screen link to, so it is what gets played;
 * warming every historical flight would spend forty Deepgram calls per demo
 * start to cover pages nobody opens.
 *
 * Never throws. A failed warm just restores the old behavior for that one
 * recap -- slow, not broken -- and must not take the demo down with it.
 */
async function warmDemoRecapAudio(records: HistoricalFlightRecord[]): Promise<void> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || records.length === 0) return;

  const repo = getRepository();
  const latestPerStudent = new Map<string, HistoricalFlightRecord>();
  for (const record of records) latestPerStudent.set(record.studentId, record);

  await Promise.all(
    Array.from(latestPerStudent.values()).map(async (record) => {
      try {
        const [student, organization] = await Promise.all([
          repo.getUser(record.studentId),
          record.organizationId ? repo.getOrganization(record.organizationId) : Promise.resolve(null),
        ]);
        const instructor = record.instructorId ? await repo.getUser(record.instructorId) : null;

        // Built exactly as app/api/flights/[id]/debrief/audio/route.ts builds
        // it, because that route keys the cache on the script. Any difference
        // -- a missing field, a different instructor name, the wrong solo
        // flag -- writes an entry it will never read, and the warm silently
        // buys nothing. That has already happened once on this cache.
        const script = buildDebriefNarration({
          studentFirstName: student?.name.split(" ")[0] ?? "there",
          instructorFirstName: instructor?.name.split(" ")[0] ?? null,
          soloPilot: organization?.kind === "individual",
          narrativeRecap: record.structured.narrativeRecap,
          whatWeDid: record.structured.whatWeDid,
          wentWell: record.structured.wentWell,
          needsWork: record.structured.needsWork,
          instructorGuidance: record.structured.instructorGuidance,
          actionItems: record.structured.actionItems,
          studyReferences: record.structured.studyReferences,
        });

        const key = audioCacheKey(`debrief:${record.flightId}`, DEFAULT_TTS_VOICE, script);
        if (await getCachedAudio(key)) return;
        const audio = await synthesizeSpeech(toPilotSpeak(script), apiKey, DEFAULT_TTS_VOICE);
        await setCachedAudio(key, audio);
      } catch (err) {
        console.error("[demo-seed] recap audio warm failed for", record.flightId, err);
      }
    }),
  );
}

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

/**
 * Every-flight task set for a seeded guided debrief, plus the three items
 * lib/universal-tasks.ts appends to a real one. Duplicated here rather than
 * imported, because the real route builds these from a live flight -- if
 * that list changes, this one needs the same change to stay representative.
 */
const TODAY_FLIGHT_TASKS: { code: string; label: string; source: string }[] = [
  { code: "LANDINGS", label: "Traffic Pattern & Landings", source: "instructor_selected" },
  { code: "PREFLIGHT_INSPECTION", label: "Preflight & preparation", source: "syllabus" },
  { code: "RADIO_COMMUNICATIONS", label: "Radio communication", source: "syllabus" },
  { code: "SITUATIONAL_AWARENESS", label: "Situational awareness", source: "syllabus" },
];

/**
 * [task code, student rating, instructor rating]. Deliberately not
 * identical across the board: the student rates the landings harder on
 * themselves than the instructor does (a disagreement worth talking
 * through), both agree on preflight (a real point of agreement, not just
 * gaps), and the instructor is the one who flags the radio work the
 * student rated themselves independent on -- three different shapes of
 * feedback, not one repeated pattern.
 */
const TODAY_FLIGHT_RATINGS: [string, string, string][] = [
  ["LANDINGS", "LEARNING", "NEEDS_COACHING"],
  ["PREFLIGHT_INSPECTION", "INDEPENDENT", "INDEPENDENT"],
  ["RADIO_COMMUNICATIONS", "INDEPENDENT", "NEEDS_COACHING"],
  ["SITUATIONAL_AWARENESS", "NEEDS_COACHING", "NEEDS_COACHING"],
];

const TODAY_FLIGHT_CARDS: { category: string; title: string; prompt: string; followUps: string[] }[] = [
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

/**
 * The guided-debrief structure (flight_tasks, both assessments, their
 * ratings, and the pending debrief_cards) for one flight -- extracted from
 * what used to be seedCfiSchoolDemo's own inline block, now shared with
 * seedPilotDemo. Both personas get the identical rating pattern above: one
 * real disagreement on the recurring landing/flare weakness, one real
 * agreement on preflight, so the Compare screen has both a gap and a
 * calibration to show, not only conflict.
 *
 * Does not touch the `flights` row itself -- the caller decides that
 * flight's status, dates and track; this only adds the assessment layer
 * on top of a flight_id that already exists.
 */
async function seedGuidedAssessedFlight(
  client: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  opts: { flightId: string; studentId: string; instructorId: string },
): Promise<void> {
  const taskIds: string[] = [];
  for (const [i, task] of TODAY_FLIGHT_TASKS.entries()) {
    const id = `flight-task-demo-${randomUUID()}`;
    taskIds.push(id);
    await client.query(
      `INSERT INTO flight_tasks (id, flight_id, task_code, label, source, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, opts.flightId, task.code, task.label, task.source, i],
    );
  }

  const studentAssessmentId = `assessment-demo-${randomUUID()}`;
  const instructorAssessmentId = `assessment-demo-${randomUUID()}`;
  await client.query(
    `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id, status, submitted_at)
     VALUES ($1,$2,'student',$3,'submitted',now())`,
    [studentAssessmentId, opts.flightId, opts.studentId],
  );
  await client.query(
    `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id, status, submitted_at)
     VALUES ($1,$2,'instructor',$3,'submitted',now())`,
    [instructorAssessmentId, opts.flightId, opts.instructorId],
  );

  for (const [code, studentRating, instructorRating] of TODAY_FLIGHT_RATINGS) {
    const taskId = taskIds[TODAY_FLIGHT_TASKS.findIndex((t) => t.code === code)];
    await client.query(
      `INSERT INTO debrief_assessment_ratings (id, assessment_id, flight_task_id, performance_level)
       VALUES ($1,$2,$3,$4)`,
      [`rating-demo-${randomUUID()}`, studentAssessmentId, taskId, studentRating],
    );
    await client.query(
      `INSERT INTO debrief_assessment_ratings (id, assessment_id, flight_task_id, performance_level)
       VALUES ($1,$2,$3,$4)`,
      [`rating-demo-${randomUUID()}`, instructorAssessmentId, taskId, instructorRating],
    );
  }

  const cardsInsert = buildInsertRows(
    TODAY_FLIGHT_CARDS.map((card, index) => [
      `card-demo-${randomUUID()}`,
      opts.flightId,
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
}

export async function seedPilotDemo(expiresAt: Date): Promise<LiveDemoResult> {
  const orgId = `org-demo-pilot-${randomUUID()}`;
  const userId = `user-demo-pilot-${randomUUID()}`;
  const priorInstructorId = `user-demo-instructor-prior-${randomUUID()}`;
  const currentInstructorId = `user-demo-instructor-${randomUUID()}`;
  const aircraftId = `aircraft-demo-${randomUUID()}`;
  const email = `${userId}@afterflight.demo`;
  const name = "Jordan Pilot";
  const aircraftType = "Cessna 172S";
  // Reusing DEMO_HISTORY's own instructor names, not inventing new ones --
  // the transcripts say "Sarah had me..." / "Marcus" by name in prose (see
  // video-demo-data.ts), so the instructor identity here has to match that
  // prose exactly or a debrief would quote a CFI who isn't in the org, which
  // is the one failure mode SOLO_DEMO_HISTORY exists to avoid. Fresh random
  // ids, though -- not DEMO_PRIOR_INSTRUCTOR_ID/DEMO_INSTRUCTOR_ID, which
  // belong to the separate, fixed-id internal Video Demo Mode and must never
  // collide with a per-visitor row.
  const priorInstructorName = DEMO_PRIOR_INSTRUCTOR_NAME;
  const currentInstructorName = DEMO_INSTRUCTOR_NAME;
  const priorInstructorEmail = `${priorInstructorId}@afterflight.demo`;
  const currentInstructorEmail = `${currentInstructorId}@afterflight.demo`;

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    // 'school', not 'individual' -- an individual org is a solo pilot with
    // no CFI (see flights/new/page.tsx's allowInviteCfi), and the freeform
    // guidance mode that kind defaults to explicitly skips flight_tasks,
    // assessments and cards (see the resolver at
    // app/(product)/flights/[id]/debrief/page.tsx). A student with a real,
    // two-instructor continuity story needs 'guided' mode and an org kind
    // that does not structurally forbid the instructor relationship this
    // whole story depends on. 'school' is what video-demo-seed.ts already
    // uses for the identical story, for the identical reason.
    await client.query(
      `INSERT INTO organizations (id, name, kind, default_guidance_mode, demo_expires_at)
       VALUES ($1,$2,'school','guided',$3)`,
      [orgId, `${name}'s Flights`, expiresAt.toISOString()],
    );

    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [userId, name, email],
    );
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [priorInstructorId, priorInstructorName, priorInstructorEmail],
    );
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [currentInstructorId, currentInstructorName, currentInstructorEmail],
    );

    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
       VALUES ($1,$2,$3,'student','PRIVATE')`,
      [`member-demo-${randomUUID()}`, orgId, userId],
    );
    const membersInsert = buildInsertRows([
      [`member-demo-${randomUUID()}`, orgId, priorInstructorId, "instructor"],
      [`member-demo-${randomUUID()}`, orgId, currentInstructorId, "instructor"],
    ]);
    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ${membersInsert.placeholders}`,
      membersInsert.values,
    );
    await client.query(`INSERT INTO instructors (id, name, organization_id) VALUES ($1,$2,$3)`, [
      priorInstructorId,
      priorInstructorName,
      orgId,
    ]);
    await client.query(`INSERT INTO instructors (id, name, organization_id) VALUES ($1,$2,$3)`, [
      currentInstructorId,
      currentInstructorName,
      orgId,
    ]);

    // Real at the data level, not just in transcript prose: the prior
    // instructor's link is inactive (they have moved on), the current one is
    // active and primary. This is what a handoff actually looks like in the
    // schema -- see student_instructors.status/is_primary.
    const linksInsert = buildInsertRows([
      [`link-demo-${randomUUID()}`, userId, priorInstructorId, orgId, false, "inactive"],
      [`link-demo-${randomUUID()}`, userId, currentInstructorId, orgId, true, "active"],
    ]);
    await client.query(
      `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
       VALUES ${linksInsert.placeholders}`,
      linksInsert.values,
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

    // DEMO_HISTORY, not SOLO_DEMO_HISTORY -- the whole point of this seed is
    // the two-instructor continuity story DEMO_HISTORY was built for (see
    // its own doc comment: "a weakness that outlived a change of
    // instructor... unreachable by construction" with a single CFI).
    // instructorId/instructorName travel per-entry now (see
    // seedHistoricalFlights), so one call seeds the whole arc -- entries
    // before the handover index carry the prior instructor, the rest carry
    // the current one, and previousActionItems threads continuously across
    // that change exactly the way video-demo-seed.ts's own loop does.
    const entries = DEMO_HISTORY.map((e, i) => ({
      transcript: e.transcript,
      instructorId: i < DEMO_INSTRUCTOR_HANDOVER_INDEX ? priorInstructorId : currentInstructorId,
      instructorName: i < DEMO_INSTRUCTOR_HANDOVER_INDEX ? priorInstructorName : currentInstructorName,
    }));
    const historicalRecords = await seedHistoricalFlights(client, entries, {
      studentId: userId,
      organizationId: orgId,
      aircraftId,
      aircraftTail: tail,
      aircraftType,
    });

    // Guided mode, not freeform: a real "today" flight -- flight_tasks, both
    // assessments, their ratings (one disagreement on the recurring
    // landing/flare weakness, one agreement on preflight) and pending
    // debrief_cards, via the same helper seedCfiSchoolDemo uses for its own
    // primary student. Still not_started, same as that flight -- this is the
    // structure a guided debrief walks through, not a pre-completed one.
    const todayReal = nextRealFlight();
    const todayFlightId = `flight-demo-${randomUUID()}`;
    const todayIso = new Date().toISOString();
    await client.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, debrief_status, track
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'not_started',$10)`,
      [
        todayFlightId,
        userId,
        orgId,
        aircraftId,
        todayReal.departureAirport,
        todayReal.arrivalAirport,
        localIsoDate(),
        todayReal.durationMinutes,
        currentInstructorId,
        JSON.stringify(withTimestamps(todayReal.track, todayIso, todayReal.durationMinutes)),
      ],
    );
    await seedGuidedAssessedFlight(client, { flightId: todayFlightId, studentId: userId, instructorId: currentInstructorId });

    await client.query("COMMIT");
    await Promise.all([
      seedDerivedContent(historicalRecords),
      // Deterministic recurrence, reusing the exact mechanism
      // seedCfiSchoolDemo's primary student already relies on -- see that
      // function's doc comment on why the mock analyzer alone cannot be
      // trusted to repeat the same skill word-for-word. Curated to the last
      // flight under the prior instructor plus two under the current one
      // (not a plain last-3, which here would land entirely after the
      // handover and prove nothing about continuity) so the guarantee
      // itself spans the instructor change, not just the natural narrative.
      seedRecurringInsightSignal([
        historicalRecords[DEMO_INSTRUCTOR_HANDOVER_INDEX - 1],
        historicalRecords[DEMO_INSTRUCTOR_HANDOVER_INDEX],
        historicalRecords[historicalRecords.length - 1],
      ]),
      seedRadioPractice(orgId, userId, currentInstructorId),
      warmDemoRecapAudio(historicalRecords),
    ]);
    return {
      organizationId: orgId,
      loginUserId: userId,
      loginEmail: email,
      loginName: name,
      redirectPath: "/home",
      hint: `${priorInstructorName.split(" ")[0]} flew your first few lessons; ${currentInstructorName.split(" ")[0]} has been your CFI since -- open Progress to see what carried forward.`,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * The school's roster.
 *
 * Three students, each with an identical four-flight history, made the
 * insights page read as a toy: "most common training issues" over twelve
 * flights that were the same four flights three times. A prospect looking at
 * a school demo is asking whether this tells them anything about a real
 * school, and three identical students cannot.
 *
 * Eight now, with DIFFERENT amounts of history -- `flights` is how many of
 * DEMO_HISTORY's entries each one gets. That variation is the point:
 *
 *   - the deep ones give the aggregate something to aggregate
 *   - the thin ones are what an admin actually needs to see. A student with
 *     two debriefs is the one whose progress nobody can judge yet, and the
 *     insights page saying so is more use than another averaged bar.
 *
 * Capped at DEMO_HISTORY's ten entries. Ask for more and the slice silently
 * returns fewer, which is how a "six flight" student quietly becomes a
 * four-flight one.
 */
const SCHOOL_STUDENTS = [
  { name: "Riley Student", certificateType: "PRIVATE" as const, flights: 6 },
  { name: "Sam Trainee", certificateType: "PRIVATE" as const, flights: 2 },
  { name: "Casey Learner", certificateType: null, flights: 5 },
  { name: "Priya Raman", certificateType: "PRIVATE" as const, flights: 8 },
  { name: "Marcus Webb", certificateType: null, flights: 4 },
  { name: "Dana Osei", certificateType: "PRIVATE" as const, flights: 7 },
  { name: "Tomas Ruiz", certificateType: null, flights: 3 },
  { name: "Ellie Hart", certificateType: null, flights: 2 },
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

      // Each student gets their own depth of history -- see SCHOOL_STUDENTS.
      //
      // Taken from the END of DEMO_HISTORY -- these students have a CFI, so
      // the instructor-voiced transcripts are right here (the solo persona
      // uses SOLO_DEMO_HISTORY instead). The end, because that is where the
      // narrative converges on one repeated
      // skill, which is what Progress's recurring-themes card needs before it
      // will populate at all. A student with only two flights therefore has
      // too little for a theme to emerge, which is correct -- that is exactly
      // what "limited feedback" means on the insights page.
      const wanted = Math.min(student.flights, DEMO_HISTORY.length);
      const entries = DEMO_HISTORY.slice(-wanted).map((e) => ({
        transcript: e.transcript,
        instructorId: instructorUserId,
        instructorName,
      }));
      historicalRecords.push(
        ...(await seedHistoricalFlights(client, entries, {
          studentId: student.userId,
          organizationId: orgId,
          aircraftId,
          aircraftTail: tail,
          aircraftType,
        })),
      );
    }

    // One "today" flight, guided mode, for the first student -- flight_tasks
    // + 3 pending debrief_cards so the CFI persona has a real guided debrief
    // to walk through, same shape as video-demo-seed.ts's seedTodayFlight().
    const primaryStudentId = studentIds[0];

    // Today-scheduled reservations are what actually populate the CFI
    // Today page's "Today's Students" section (app/(product)/cfi/today/
    // page.tsx filters reservations by status='scheduled' + today's date) --
    // without these rows the roster below (Debrief In Progress) is the only
    // thing that shows, and "Today's Students" reads empty. The primary
    // student already flew (their reservation is in the past, matching the
    // "today" flight + guided debrief below); the other two are scheduled
    // later today so the CFI's day reads as a real, multi-student schedule
    // instead of one lesson in isolation.
    const now = new Date();
    const scheduledStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const scheduledEnd = new Date(now.getTime() - 60 * 60 * 1000);
    // Only some of the roster flies today, at spread times.
    //
    // The old version had a two-slot table and fell back to the last entry for
    // everyone beyond it -- fine for three students, but the roster is eight
    // now and six of them would have been booked into the identical hour. A
    // schedule where most of the day is one time is worse than a short one.
    //
    // Four fly today: the primary student already flew (their reservation is
    // in the past, matching the "today" flight and its guided debrief below),
    // and three are booked at two-hour intervals ahead. The rest have history
    // but nothing on the schedule, which is what a real day looks like.
    const FLYING_TODAY = 4;
    const reservationRows: [string, Date, Date][] = [
      [primaryStudentId, scheduledStart, scheduledEnd],
      ...studentIds.slice(1, FLYING_TODAY).map((studentId, i): [string, Date, Date] => {
        const startHours = 2 + i * 2;
        return [
          studentId,
          new Date(now.getTime() + startHours * 60 * 60 * 1000),
          new Date(now.getTime() + (startHours + 1) * 60 * 60 * 1000),
        ];
      }),
    ];
    const reservationsInsert = buildInsertRows(
      reservationRows.map(([studentId, start, end]) => [
        `reservation-demo-${randomUUID()}`,
        orgId,
        studentId,
        instructorUserId,
        aircraftId,
        start.toISOString(),
        end.toISOString(),
        "scheduled",
      ]),
    );
    await client.query(
      `INSERT INTO reservations (id, organization_id, student_id, instructor_id, aircraft_id, scheduled_start, scheduled_end, status)
       VALUES ${reservationsInsert.placeholders}`,
      reservationsInsert.values,
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

    await seedGuidedAssessedFlight(client, { flightId: todayFlightId, studentId: primaryStudentId, instructorId: instructorUserId });

    await client.query("COMMIT");
    await Promise.all([
      seedDerivedContent(historicalRecords),
      seedRecurringInsightSignal(historicalRecords.filter((r) => r.studentId === primaryStudentId)),
      ...studentIds.map((studentId) => seedRadioPractice(orgId, studentId, instructorUserId)),
      warmDemoRecapAudio(historicalRecords),
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
