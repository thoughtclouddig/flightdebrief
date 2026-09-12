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

/**
 * A demo's historical flights must stay recent as real time passes --
 * REAL_DEMO_FLIGHTS' own `takeoffIso` values are fixed calendar dates from
 * whenever scripts/fetch-real-tracks.mjs last ran, so using them directly as
 * the visible flight date makes "this student flew last week" quietly become
 * "flew months ago." This keeps the real flight's geometry (route, track,
 * duration) entirely untouched -- withTimestamps only needs an anchor to
 * space points across -- and only replaces WHEN it visibly happened, using
 * the real flight's own time-of-day so seeded flights don't all land at
 * midnight.
 */
function relativeTakeoffIso(daysAgo: number, realTakeoffIso: string): string {
  const timeOfDay = realTakeoffIso.slice(11); // "HH:MM:SSZ"
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return `${date.toISOString().slice(0, 10)}T${timeOfDay}`;
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
    /**
     * How many days before "now" the LAST (most recent) entry happened;
     * earlier entries recede further back by `intervalDays` each. Defaults
     * give a normally-active student (most recent flight a couple of days
     * ago, roughly weekly cadence before that) -- a caller seeding a stale
     * "hasn't flown in a while" student passes a much larger
     * `mostRecentDaysAgo` instead.
     */
    mostRecentDaysAgo?: number;
    intervalDays?: number;
  },
): Promise<HistoricalFlightRecord[]> {
  const records: HistoricalFlightRecord[] = [];
  const flightRows: unknown[][] = [];
  const debriefRows: unknown[][] = [];
  let previousActionItems: string[] = [];
  const mostRecentDaysAgo = opts.mostRecentDaysAgo ?? 2;
  const intervalDays = opts.intervalDays ?? 6;

  // Real flights only supply geometry now (route, track, duration) -- the
  // visible date is synthetic (see relativeTakeoffIso), so there is no
  // reason to sort them by their own fixed calendar date anymore. Drawn in
  // whatever order the rotating cursor gives, paired 1:1 with entries, which
  // are already oldest-first (the narrative arc's own order).
  const realFlights = entries.map(() => nextRealFlight());

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
    const daysAgo = mostRecentDaysAgo + (entries.length - 1 - i) * intervalDays;
    const takeoffIso = relativeTakeoffIso(daysAgo, real.takeoffIso);
    const flightDate = takeoffIso.slice(0, 10);
    const track = withTimestamps(real.track, takeoffIso, real.durationMinutes);

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
        hasInstructor: instructorName !== null,
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
      takeoffIso,
    ]);
    debriefRows.push([
      debriefId,
      flightId,
      transcript,
      Math.round(real.durationMinutes * 0.6),
      JSON.stringify(result),
      "mock",
      takeoffIso,
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
      // This demo-history seed is for CFI/School Insights fixtures, not the
      // Vector training flow -- no evidence interpretation is computed here.
      instructorQuote: null,
      observedMechanism: null,
    })),
    ...record.structured.actionItems.map((description) => ({
      flightId: record.flightId,
      debriefId: record.debriefId,
      category: "before_next_flight" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
      instructorQuote: null,
      observedMechanism: null,
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
    instructorQuote: null,
    observedMechanism: null,
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

interface GuidedFlightVariant {
  tasks: { code: string; label: string; source: string }[];
  /** [task code, student rating, instructor rating]. */
  ratings: [string, string, string][];
  cards: { category: string; title: string; prompt: string; followUps: string[] }[];
}

/**
 * Two variants so two students can each have a real pending guided debrief
 * without looking like clones of each other -- every-flight task set, plus
 * the three items lib/universal-tasks.ts appends to a real one, duplicated
 * here rather than imported because the real route builds these from a live
 * flight (if that list changes, these need the same change to stay
 * representative).
 *
 * Variant 0 (landings/preflight/radio/situational awareness): the student
 * rates the landings harder on themselves than the instructor does (a
 * disagreement worth talking through), both agree on preflight (a real
 * agreement, not just gaps), and the instructor is the one who flags the
 * radio work the student rated themselves independent on.
 *
 * Variant 1 (short-field/crosswind/checklist/decision-making): the reverse
 * shape of disagreement -- the instructor rates crosswind handling higher
 * than the student gives themselves credit for, a different, equally real
 * kind of gap (underconfidence, not overconfidence).
 */
const GUIDED_FLIGHT_VARIANTS: GuidedFlightVariant[] = [
  {
    tasks: [
      { code: "LANDINGS", label: "Traffic Pattern & Landings", source: "instructor_selected" },
      { code: "PREFLIGHT_INSPECTION", label: "Preflight & preparation", source: "syllabus" },
      { code: "RADIO_COMMUNICATIONS", label: "Radio communication", source: "syllabus" },
      { code: "SITUATIONAL_AWARENESS", label: "Situational awareness", source: "syllabus" },
    ],
    ratings: [
      ["LANDINGS", "LEARNING", "NEEDS_COACHING"],
      ["PREFLIGHT_INSPECTION", "INDEPENDENT", "INDEPENDENT"],
      ["RADIO_COMMUNICATIONS", "INDEPENDENT", "NEEDS_COACHING"],
      ["SITUATIONAL_AWARENESS", "NEEDS_COACHING", "NEEDS_COACHING"],
    ],
    cards: [
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
    ],
  },
  {
    tasks: [
      { code: "CROSSWIND_LANDING", label: "Crosswind Landings", source: "instructor_selected" },
      { code: "SHORT_FIELD_LANDING", label: "Short-field landings", source: "syllabus" },
      { code: "CHECKLIST_DISCIPLINE", label: "Checklist usage", source: "syllabus" },
      { code: "RISK_MANAGEMENT", label: "Aeronautical decision-making", source: "syllabus" },
    ],
    ratings: [
      ["CROSSWIND_LANDING", "LEARNING", "INDEPENDENT"],
      ["SHORT_FIELD_LANDING", "NEEDS_COACHING", "NEEDS_COACHING"],
      ["CHECKLIST_DISCIPLINE", "INDEPENDENT", "INDEPENDENT"],
      ["RISK_MANAGEMENT", "LEARNING", "NEEDS_COACHING"],
    ],
    cards: [
      {
        category: "KEY_TASK",
        title: "Crosswind Correction",
        prompt: "Talk through the crosswind landings today -- how did the correction feel through the flare?",
        followUps: ["Did you feel behind the airplane at any point, or ahead of it the whole time?"],
      },
      {
        category: "STRENGTHS",
        title: "What Went Well",
        prompt: "Checklist flow was clean start to finish -- what's making that stick this time?",
        followUps: ["Anything from the short-field work you'd repeat next time?"],
      },
      {
        category: "IMPROVEMENT",
        title: "Short-Field Technique",
        prompt: "The short-field landings were a little long a couple of times -- what were you seeing on short final?",
        followUps: ["What's one adjustment to get the touchdown point more consistent?"],
      },
    ],
  },
];

/**
 * The guided-debrief structure (flight_tasks, both assessments, their
 * ratings, and the pending debrief_cards) for one flight -- extracted from
 * what used to be seedCfiSchoolDemo's own inline block, now shared with
 * seedPilotDemo and every V2 CFI/School roster student who gets a pending
 * guided debrief. `variant` picks one of GUIDED_FLIGHT_VARIANTS so two
 * students in the same org don't get an identical structure -- each variant
 * carries its own real disagreement and its own real agreement, so the
 * Compare screen always has both a gap and a calibration to show, never
 * only conflict.
 *
 * Does not touch the `flights` row itself -- the caller decides that
 * flight's status, dates and track; this only adds the assessment layer
 * on top of a flight_id that already exists.
 */
async function seedGuidedAssessedFlight(
  client: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  opts: { flightId: string; studentId: string; instructorId: string; variant?: number },
): Promise<void> {
  const { tasks, ratings, cards } = GUIDED_FLIGHT_VARIANTS[opts.variant ?? 0]!;
  const taskIds: string[] = [];
  for (const [i, task] of tasks.entries()) {
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

  for (const [code, studentRating, instructorRating] of ratings) {
    const taskId = taskIds[tasks.findIndex((t) => t.code === code)];
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
    cards.map((card, index) => [
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

interface DemoRosterStudent {
  name: string;
  certificateType: "PRIVATE" | null;
  /** How many of DEMO_HISTORY's entries this student gets -- see historyEndIndex for WHICH entries. */
  flights: number;
  /**
   * Which DEMO_HISTORY entry is this student's own most recent flight --
   * undefined (the default, and every CFI_V2_STUDENTS entry) means the last
   * entry in the array, DEMO_HISTORY.length - 1. School V2's roster sets
   * this per student (see demoHistoryWindow) so 24 students don't all
   * inherit the exact same "current" flight, and therefore the exact same
   * current-skill-state, from the one shared narrative array -- see the
   * SCHOOL-V2-2 correction report for why that undermined the point of a
   * 24-student demo. Clamped automatically (via demoHistoryWindow) to stay
   * in range for this student's own `flights` count, so an out-of-range
   * value here can never crash a seed or silently produce a shorter
   * history than requested.
   */
  historyEndIndex?: number;
  /** Index into the org's aircraft array. */
  aircraftIndex: number;
  /** Index into the org's instructor array -- the student's current, active, primary CFI. */
  instructorIndex: number;
  /** Index into the org's instructor array for a prior CFI, if this student has an instructor-handoff story. */
  priorInstructorIndex?: number;
  /** How many of this student's `flights` (from the start) happened under `priorInstructorIndex` before the handoff to `instructorIndex`. */
  handoffAt?: number;
  /** Days before "now" the student's most recent historical flight happened (earlier ones recede further back). Default 2. A large value (e.g. 35+) is what makes a student read as stale/overdue. */
  mostRecentDaysAgo?: number;
  /** Forces a 3-flight recurring-weakness signal (see seedRecurringInsightSignal) on this student's most recent history. */
  recurringWeakness?: boolean;
  /** Gives this student their own real, not-yet-debriefed guided flight (flight_tasks + both assessments + ratings + pending cards) -- a genuine student/instructor rating disagreement, not just narrative. `daysAgo` of 0 is "today"; 1+ is a backlog item from a prior day. */
  pendingGuidedDebrief?: { variant: number; daysAgo: number };
  /** An upcoming (not yet flown) reservation N hours from now. Ignored if `pendingGuidedDebrief` is set (that student's reservation is already implied by daysAgo, in the past). */
  scheduledInHours?: number;
}

/**
 * Maps one student's (flights, historyEndIndex) onto an actual [start, end]
 * range inside DEMO_HISTORY -- pure integer math, no DB, so the assignment
 * logic is directly unit-testable (see live-demo-seed.test.ts) without
 * exercising the rest of the seed transaction.
 *
 * `end` is clamped to historyLength - 1 (can't reach past the array) and to
 * at least `wanted - 1` (can't request fewer entries than `flights` calls
 * for, which would happen if a hand-picked historyEndIndex were too low for
 * a student with a large `flights` count) -- so every caller-supplied value
 * is safe by construction, never a source of an out-of-range slice.
 */
export function demoHistoryWindow(
  flights: number,
  historyEndIndex: number | undefined,
  historyLength: number,
): { start: number; end: number } {
  const wanted = Math.min(flights, historyLength);
  const requestedEnd = historyEndIndex ?? historyLength - 1;
  const end = Math.max(wanted - 1, Math.min(requestedEnd, historyLength - 1));
  return { start: end - wanted + 1, end };
}

interface DemoRosterConfig {
  orgName: string;
  expiresAt: Date;
  /** Index 0 is always the CFI-persona login identity when loginAs === "instructor". */
  instructorNames: string[];
  /**
   * Per-instructor override for the LOCAL PART of their demo login email,
   * index-aligned with instructorNames -- undefined (the default, and every
   * current School V2 instructor) falls back to `${id}@afterflight.demo`,
   * where id already contains a full UUID and reads as an obviously
   * synthetic address anywhere it's shown back to the viewer (e.g. CFI V2
   * Profile). A short random suffix is still appended even when an override
   * is given, because users.email is UNIQUE and a demo org lives for up to
   * DEMO_ORG_TTL_MS -- two people starting a fresh CFI demo within that
   * window would otherwise collide on one literal fixed address and the
   * second seed transaction would fail outright. Only the CFI persona's
   * login (index 0, "Morgan CFI") uses this today.
   */
  instructorEmailLocalParts?: (string | undefined)[];
  /** Same convention as instructorEmailLocalParts, for the org's always-present Taylor Admin -- undefined falls back to `${adminUserId}@afterflight.demo`, which embeds a full UUID. Only School V2's admin login (Taylor Admin) uses this today. */
  adminEmailLocalPart?: string;
  aircraft: { prefix: string; type: string; make: string; model: string }[];
  students: DemoRosterStudent[];
  loginAs: "instructor" | "admin";
  redirectPath: "/cfi/today" | "/admin/overview";
  hint: string;
}

/**
 * Shared roster-seeding machinery for both canonical V2 CFI/School demos --
 * seedCfiV2Demo and seedSchoolV2Demo differ only in the DemoRosterConfig they
 * pass in (roster size, instructor/aircraft count, which login lands where),
 * not in how any of it gets built. Replaces the old seedCfiSchoolDemo, which
 * conflated the two personas into one hardcoded single-instructor,
 * single-aircraft roster with no real difference between them.
 */
async function seedDemoRosterOrg(config: DemoRosterConfig): Promise<LiveDemoResult> {
  const orgId = `org-demo-school-${randomUUID()}`;
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    await client.query(`INSERT INTO organizations (id, name, kind, demo_expires_at) VALUES ($1,$2,'school',$3)`, [
      orgId,
      config.orgName,
      config.expiresAt.toISOString(),
    ]);

    const instructorIds = config.instructorNames.map(() => `user-demo-instructor-${randomUUID()}`);
    const instructorEmails = instructorIds.map((id, i) => {
      const localPart = config.instructorEmailLocalParts?.[i];
      // "+shortSuffix" is a real, valid email convention (delivered to
      // localPart@domain by any mail system that matters here, which is
      // none -- this domain never accepts mail) that keeps the visible
      // name legible while still guaranteeing per-run uniqueness -- see
      // this field's own doc comment on DemoRosterConfig for why a fully
      // fixed address isn't safe against the UNIQUE constraint.
      return localPart ? `${localPart}+${randomUUID().slice(0, 8)}@afterflight.demo` : `${id}@afterflight.demo`;
    });
    const instructorUsersInsert = buildInsertRows(
      instructorIds.map((id, i) => [id, config.instructorNames[i], instructorEmails[i], instructorEmails[i], true]),
    );
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ${instructorUsersInsert.placeholders}`,
      instructorUsersInsert.values,
    );
    const instructorMembersInsert = buildInsertRows(
      instructorIds.map((id) => [`member-demo-${randomUUID()}`, orgId, id, "instructor"]),
    );
    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ${instructorMembersInsert.placeholders}`,
      instructorMembersInsert.values,
    );
    const instructorsInsert = buildInsertRows(instructorIds.map((id, i) => [id, config.instructorNames[i], orgId]));
    await client.query(
      `INSERT INTO instructors (id, name, organization_id) VALUES ${instructorsInsert.placeholders}`,
      instructorsInsert.values,
    );

    // Always present regardless of loginAs -- a real school/CFI org has an
    // admin either way, and the CFI persona's own org still needs one to
    // exist for the "who else is in this org" story to be honest, even
    // though this persona never logs in as them.
    const adminUserId = `user-demo-admin-${randomUUID()}`;
    const adminEmail = config.adminEmailLocalPart
      ? `${config.adminEmailLocalPart}+${randomUUID().slice(0, 8)}@afterflight.demo`
      : `${adminUserId}@afterflight.demo`;
    const adminName = "Taylor Admin";
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1,$2,$3,$3,true)`,
      [adminUserId, adminName, adminEmail],
    );
    await client.query(`INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ($1,$2,$3,'admin')`, [
      `member-demo-${randomUUID()}`,
      orgId,
      adminUserId,
    ]);

    const aircraftIds = config.aircraft.map(() => `aircraft-demo-${randomUUID()}`);
    const aircraftTails: string[] = [];
    for (let i = 0; i < config.aircraft.length; i++) {
      const spec = config.aircraft[i]!;
      aircraftTails.push(
        await insertDemoAircraft(client, {
          id: aircraftIds[i]!,
          prefix: String(i + 2),
          type: spec.type,
          make: spec.make,
          model: spec.model,
          homeAirport: SCHOOL_AIRPORT,
          organizationId: orgId,
        }),
      );
    }

    const students = config.students.map((student) => ({ ...student, userId: `user-demo-student-${randomUUID()}` }));
    const studentIds = students.map((s) => s.userId);
    const usersInsert = buildInsertRows(
      students.map((s) => [s.userId, s.name, `${s.userId}@afterflight.demo`, `${s.userId}@afterflight.demo`, true]),
    );
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ${usersInsert.placeholders}`,
      usersInsert.values,
    );

    const membersInsert = buildInsertRows(
      students.map((s) => [`member-demo-${randomUUID()}`, orgId, s.userId, "student", s.certificateType]),
    );
    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
       VALUES ${membersInsert.placeholders}`,
      membersInsert.values,
    );

    // One active+primary link to the student's current instructor, plus one
    // inactive link to their prior instructor for anyone with a handoff
    // story -- the same real shape seedPilotDemo's own Jordan handoff uses
    // (student_instructors.status/is_primary), not a narrative-only effect.
    const linkRows: unknown[][] = [];
    for (const s of students) {
      linkRows.push([`link-demo-${randomUUID()}`, s.userId, instructorIds[s.instructorIndex], orgId, true, "active"]);
      if (s.priorInstructorIndex !== undefined) {
        linkRows.push([`link-demo-${randomUUID()}`, s.userId, instructorIds[s.priorInstructorIndex], orgId, false, "inactive"]);
      }
    }
    const linksInsert = buildInsertRows(linkRows);
    await client.query(
      `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
       VALUES ${linksInsert.placeholders}`,
      linksInsert.values,
    );

    // Each student gets their own depth of history (DemoRosterStudent.flights)
    // AND their own window into DEMO_HISTORY (historyEndIndex, defaulting to
    // the last entry) -- and, if they have a handoff story, their early
    // entries are attributed to the prior instructor and the rest to the
    // current one. Every student used to take the exact same tail slice, so
    // all 24 School V2 students inherited the identical "current" flight and
    // therefore the identical current-skill-state from the one shared
    // narrative array (see the SCHOOL-V2-2 correction report). demoHistoryWindow
    // still lets a student converge on the array's repeated-skill ending when
    // that's the intended story (Progress's/Insights' recurring-themes cards
    // need SOME students there) -- it just isn't every student anymore.
    const historicalRecords: HistoricalFlightRecord[] = [];
    for (const s of students) {
      const { start, end } = demoHistoryWindow(s.flights, s.historyEndIndex, DEMO_HISTORY.length);
      const slice = DEMO_HISTORY.slice(start, end + 1);
      const entries = slice.map((e, i) => {
        const usesPrior = s.priorInstructorIndex !== undefined && s.handoffAt !== undefined && i < s.handoffAt;
        const idx = usesPrior ? s.priorInstructorIndex! : s.instructorIndex;
        return { transcript: e.transcript, instructorId: instructorIds[idx]!, instructorName: config.instructorNames[idx]! };
      });
      historicalRecords.push(
        ...(await seedHistoricalFlights(client, entries, {
          studentId: s.userId,
          organizationId: orgId,
          aircraftId: aircraftIds[s.aircraftIndex]!,
          aircraftTail: aircraftTails[s.aircraftIndex]!,
          aircraftType: config.aircraft[s.aircraftIndex]!.type,
          mostRecentDaysAgo: s.mostRecentDaysAgo,
        })),
      );
    }

    // Reservations: an upcoming lesson for anyone with scheduledInHours, or a
    // (necessarily past) one for anyone with a pending guided debrief -- a
    // real flight implies a real scheduled lesson either way.
    const reservationRows: unknown[][] = [];
    for (const s of students) {
      if (s.pendingGuidedDebrief) {
        const start = new Date(Date.now() - (s.pendingGuidedDebrief.daysAgo * 24 + 2) * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        reservationRows.push([
          `reservation-demo-${randomUUID()}`,
          orgId,
          s.userId,
          instructorIds[s.instructorIndex],
          aircraftIds[s.aircraftIndex],
          start.toISOString(),
          end.toISOString(),
          "scheduled",
        ]);
      } else if (s.scheduledInHours !== undefined) {
        const start = new Date(Date.now() + s.scheduledInHours * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        reservationRows.push([
          `reservation-demo-${randomUUID()}`,
          orgId,
          s.userId,
          instructorIds[s.instructorIndex],
          aircraftIds[s.aircraftIndex],
          start.toISOString(),
          end.toISOString(),
          "scheduled",
        ]);
      }
    }
    if (reservationRows.length > 0) {
      const reservationsInsert = buildInsertRows(reservationRows);
      await client.query(
        `INSERT INTO reservations (id, organization_id, student_id, instructor_id, aircraft_id, scheduled_start, scheduled_end, status)
         VALUES ${reservationsInsert.placeholders}`,
        reservationsInsert.values,
      );
    }

    // Real route/duration/track per pending-guided student, re-dated to when
    // they supposedly flew (today, or a prior day for a debrief backlog item)
    // so the flight's map never shows the "no track data available" empty
    // state -- same treatment seedPilotDemo's own today flight uses.
    for (const s of students) {
      if (!s.pendingGuidedDebrief) continue;
      const real = nextRealFlight();
      const flightId = `flight-demo-${randomUUID()}`;
      const takeoffIso = relativeTakeoffIso(s.pendingGuidedDebrief.daysAgo, real.takeoffIso);
      await client.query(
        `INSERT INTO flights (
           id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
           flight_date, duration_minutes, instructor_id, debrief_status, track
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'not_started',$10)`,
        [
          flightId,
          s.userId,
          orgId,
          aircraftIds[s.aircraftIndex],
          real.departureAirport,
          real.arrivalAirport,
          takeoffIso.slice(0, 10),
          real.durationMinutes,
          instructorIds[s.instructorIndex],
          JSON.stringify(withTimestamps(real.track, takeoffIso, real.durationMinutes)),
        ],
      );
      await seedGuidedAssessedFlight(client, {
        flightId,
        studentId: s.userId,
        instructorId: instructorIds[s.instructorIndex]!,
        variant: s.pendingGuidedDebrief.variant,
      });
    }

    await client.query("COMMIT");
    await Promise.all([
      seedDerivedContent(historicalRecords),
      ...students
        .filter((s) => s.recurringWeakness)
        .map((s) => seedRecurringInsightSignal(historicalRecords.filter((r) => r.studentId === s.userId))),
      ...studentIds.map((studentId) => seedRadioPractice(orgId, studentId, instructorIds[0]!)),
      warmDemoRecapAudio(historicalRecords),
    ]);

    return config.loginAs === "admin"
      ? { organizationId: orgId, loginUserId: adminUserId, loginEmail: adminEmail, loginName: adminName, redirectPath: config.redirectPath, hint: config.hint }
      : {
          organizationId: orgId,
          loginUserId: instructorIds[0]!,
          loginEmail: instructorEmails[0]!,
          loginName: config.instructorNames[0]!,
          redirectPath: config.redirectPath,
          hint: config.hint,
        };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Ten students under two CFIs and two aircraft -- "a busy independent CFI or
 * instructor inside a flight school," not a school dashboard. The second CFI
 * (Jamie Ortiz) exists specifically for instructor continuity: Casey
 * Learner's early flights are theirs, handed off to Morgan (the CFI persona's
 * own login) partway through, so /cfi's roster shows a real handoff instead
 * of a single-CFI roster that can never exercise one.
 */
const CFI_V2_STUDENTS: DemoRosterStudent[] = [
  { name: "Riley Student", certificateType: "PRIVATE", flights: 1, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 3, scheduledInHours: 3 },
  { name: "Sam Trainee", certificateType: "PRIVATE", flights: 3, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 4, scheduledInHours: 6 },
  { name: "Priya Raman", certificateType: "PRIVATE", flights: 5, aircraftIndex: 1, instructorIndex: 0, mostRecentDaysAgo: 5 },
  { name: "Dana Osei", certificateType: "PRIVATE", flights: 8, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 5, pendingGuidedDebrief: { variant: 0, daysAgo: 0 } },
  { name: "Marcus Webb", certificateType: null, flights: 4, aircraftIndex: 1, instructorIndex: 0, mostRecentDaysAgo: 3, recurringWeakness: true },
  { name: "Casey Learner", certificateType: null, flights: 6, aircraftIndex: 0, instructorIndex: 0, priorInstructorIndex: 1, handoffAt: 3, mostRecentDaysAgo: 4 },
  { name: "Tomas Ruiz", certificateType: "PRIVATE", flights: 3, aircraftIndex: 1, instructorIndex: 0, mostRecentDaysAgo: 6, pendingGuidedDebrief: { variant: 1, daysAgo: 1 } },
  { name: "Ellie Hart", certificateType: null, flights: 6, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 4, scheduledInHours: 26 },
  { name: "Nina Alvarez", certificateType: null, flights: 2, aircraftIndex: 1, instructorIndex: 0, mostRecentDaysAgo: 40 },
  { name: "Kevin Brooks", certificateType: null, flights: 1, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 5 },
];

export async function seedCfiV2Demo(expiresAt: Date): Promise<LiveDemoResult> {
  return seedDemoRosterOrg({
    orgName: "Skyline Flight Academy",
    expiresAt,
    instructorNames: ["Morgan CFI", "Jamie Ortiz"],
    // Only Morgan (the CFI persona's own login) gets a credible email --
    // this is the address CFI V2 Profile now renders back to the viewer.
    // Jamie Ortiz is roster context, never signed into, so the default
    // UUID-based address (invisible to anyone) is unchanged.
    instructorEmailLocalParts: ["morgan.cfi"],
    aircraft: [
      { prefix: "2", type: "Piper PA-28-181", make: "Piper", model: "PA-28-181" },
      { prefix: "3", type: "Cessna 172S", make: "Cessna", model: "172S" },
    ],
    students: CFI_V2_STUDENTS,
    loginAs: "instructor",
    redirectPath: "/cfi/today",
    hint: `Dana Osei flew this morning and is ready to debrief -- open "Debrief In Progress" to try the guided flow.`,
  });
}

/**
 * Twenty-four students under five CFIs and four aircraft, distributed
 * unevenly (5/5/6/4/4) -- a functioning school, not the CFI roster re-skinned
 * under an admin login. Three instructor-handoff stories, each a different
 * CFI pair, so /admin/instructors and the recurring-theme "N instructors"
 * callouts have real variation to show instead of always naming the same
 * two people.
 *
 * historyEndIndex diversifies WHICH DEMO_HISTORY entry lands as each
 * student's own most recent flight, so their current skill state varies
 * too -- see the SCHOOL-V2-2 correction report for why leaving every
 * student at the implicit default (the array's last entry) made 22-24 of
 * 24 students all currently "need work" on the exact same one or two
 * skills. Left unset (default: the shared final entry, DEMO_HISTORY.length
 * - 1) for Marcus Webb, Ava Kimura, Casey Learner, and Amara Okafor -- the
 * four students whose specific, already browser-proven stories
 * (recurringWeakness's forced signal, or a handoff) don't need to move and
 * shouldn't risk moving. 8 of 24 students still land on that shared ending
 * (the four protected ones plus four unset here) -- a legitimate subset
 * showing the same real pattern, not the whole roster.
 */
/** Exported for live-demo-seed.test.ts -- lets the roster-shape invariants (instructor distribution, handoff pairs, recurring-weakness students, historyEndIndex diversity) be verified directly without a live DB. */
export const SCHOOL_V2_STUDENTS: DemoRosterStudent[] = [
  // Instructor 0 (Avery Chen) -- 5 students
  { name: "Riley Student", certificateType: "PRIVATE", flights: 1, historyEndIndex: 0, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 2, scheduledInHours: 2 },
  { name: "Sam Trainee", certificateType: "PRIVATE", flights: 3, historyEndIndex: 2, aircraftIndex: 1, instructorIndex: 0, mostRecentDaysAgo: 3, scheduledInHours: 5 },
  { name: "Priya Raman", certificateType: "PRIVATE", flights: 5, aircraftIndex: 0, instructorIndex: 0, mostRecentDaysAgo: 4 },
  { name: "Dana Osei", certificateType: "PRIVATE", flights: 8, aircraftIndex: 1, instructorIndex: 0, mostRecentDaysAgo: 5, pendingGuidedDebrief: { variant: 0, daysAgo: 0 } },
  { name: "Marcus Webb", certificateType: null, flights: 4, aircraftIndex: 2, instructorIndex: 0, mostRecentDaysAgo: 3, recurringWeakness: true },
  // Instructor 1 (Jamie Ortiz) -- 5 students
  { name: "Ellie Hart", certificateType: null, flights: 6, historyEndIndex: 6, aircraftIndex: 1, instructorIndex: 1, mostRecentDaysAgo: 4, scheduledInHours: 27 },
  { name: "Tomas Ruiz", certificateType: "PRIVATE", flights: 3, historyEndIndex: 4, aircraftIndex: 2, instructorIndex: 1, mostRecentDaysAgo: 6, pendingGuidedDebrief: { variant: 1, daysAgo: 1 } },
  { name: "Grace Nakamura", certificateType: "PRIVATE", flights: 7, aircraftIndex: 0, instructorIndex: 1, mostRecentDaysAgo: 6 },
  { name: "Owen Patel", certificateType: null, flights: 2, historyEndIndex: 1, aircraftIndex: 3, instructorIndex: 1, mostRecentDaysAgo: 12 },
  { name: "Casey Learner", certificateType: null, flights: 6, aircraftIndex: 1, instructorIndex: 1, priorInstructorIndex: 2, handoffAt: 3, mostRecentDaysAgo: 4 },
  // Instructor 2 (Devon Brooks) -- 6 students
  { name: "Nina Alvarez", certificateType: null, flights: 2, historyEndIndex: 2, aircraftIndex: 2, instructorIndex: 2, mostRecentDaysAgo: 45 },
  { name: "Kevin Brooks", certificateType: null, flights: 1, historyEndIndex: 1, aircraftIndex: 3, instructorIndex: 2, mostRecentDaysAgo: 5 },
  { name: "Harper Sims", certificateType: "PRIVATE", flights: 8, historyEndIndex: 7, aircraftIndex: 0, instructorIndex: 2, mostRecentDaysAgo: 3, scheduledInHours: 30 },
  { name: "Miguel Torres", certificateType: "PRIVATE", flights: 5, historyEndIndex: 4, aircraftIndex: 1, instructorIndex: 2, mostRecentDaysAgo: 7 },
  { name: "Ava Kimura", certificateType: null, flights: 4, aircraftIndex: 2, instructorIndex: 2, priorInstructorIndex: 0, handoffAt: 2, mostRecentDaysAgo: 4, recurringWeakness: true },
  { name: "Lucas Ferreira", certificateType: "PRIVATE", flights: 3, aircraftIndex: 3, instructorIndex: 2, mostRecentDaysAgo: 9 },
  // Instructor 3 (Sasha Volkov) -- 4 students
  { name: "Zoe Bennett", certificateType: "PRIVATE", flights: 7, historyEndIndex: 6, aircraftIndex: 0, instructorIndex: 3, mostRecentDaysAgo: 5 },
  { name: "Ibrahim Khan", certificateType: null, flights: 2, historyEndIndex: 4, aircraftIndex: 1, instructorIndex: 3, mostRecentDaysAgo: 18 },
  { name: "Chloe Martin", certificateType: "PRIVATE", flights: 6, historyEndIndex: 5, aircraftIndex: 2, instructorIndex: 3, mostRecentDaysAgo: 4, scheduledInHours: 51 },
  { name: "Diego Ramirez", certificateType: null, flights: 4, historyEndIndex: 5, aircraftIndex: 3, instructorIndex: 3, mostRecentDaysAgo: 8 },
  // Instructor 4 (Nora Fitzgerald) -- 4 students
  { name: "Isla Murphy", certificateType: "PRIVATE", flights: 8, historyEndIndex: 7, aircraftIndex: 0, instructorIndex: 4, mostRecentDaysAgo: 6 },
  { name: "Theo Anderson", certificateType: null, flights: 3, historyEndIndex: 3, aircraftIndex: 1, instructorIndex: 4, mostRecentDaysAgo: 10 },
  { name: "Amara Okafor", certificateType: "PRIVATE", flights: 5, aircraftIndex: 2, instructorIndex: 4, priorInstructorIndex: 3, handoffAt: 2, mostRecentDaysAgo: 5 },
  { name: "Felix Chen", certificateType: null, flights: 2, historyEndIndex: 6, aircraftIndex: 3, instructorIndex: 4, mostRecentDaysAgo: 22 },
];

export async function seedSchoolV2Demo(expiresAt: Date): Promise<LiveDemoResult> {
  return seedDemoRosterOrg({
    orgName: "Skyline Flight Academy",
    expiresAt,
    instructorNames: ["Avery Chen", "Jamie Ortiz", "Devon Brooks", "Sasha Volkov", "Nora Fitzgerald"],
    aircraft: [
      { prefix: "2", type: "Piper PA-28-181", make: "Piper", model: "PA-28-181" },
      { prefix: "3", type: "Cessna 172S", make: "Cessna", model: "172S" },
      { prefix: "4", type: "Cessna 172N", make: "Cessna", model: "172N" },
      { prefix: "5", type: "Piper PA-28-161", make: "Piper", model: "PA-28-161" },
    ],
    students: SCHOOL_V2_STUDENTS,
    adminEmailLocalPart: "taylor.admin",
    loginAs: "admin",
    redirectPath: "/admin/overview",
    hint: "24 students across 5 instructors -- check Instructors, Students, or Insights for the roster-wide view.",
  });
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
