import { generatePatternTrack } from "@/lib/geo";
import { analyzeMock } from "@/lib/ai/mock-analyzer";
import { localIsoDate } from "@/lib/date";
import { classifyTrainingSignals } from "@/lib/taxonomy";
import { computeAssessmentDifferences } from "@/lib/debrief-cards/differences";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import type {
  Aircraft,
  Debrief,
  Flight,
  Instructor,
  Organization,
  OrganizationMember,
  Reservation,
  StudentInstructor,
  TrainingItem,
  TrainingSignal,
  User,
} from "@/lib/types";

// --- Organization + people -------------------------------------------------
// One school org backs the whole demo; individual/independent-CFI workspaces
// use the exact same shapes (see Organization.kind), just with fewer members.

export const ORG_FALCON: Organization = {
  id: "org-falcon",
  name: "Falcon Aviation",
  kind: "school",
  defaultGuidanceMode: "guided",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  subscriptionQuantity: 1,
  demoExpiresAt: null,
  createdAt: new Date().toISOString(),
};

// Additional orgs demonstrating the other account tiers (School Pro is
// already fully represented by ORG_FALCON above): an independent CFI running
// their own small roster, a solo individual pilot with no school at all, and
// two more lightweight schools with their own CFI/student rosters.
export const ORG_CFI_KEVIN: Organization = {
  id: "org-cfi-kevin",
  name: "Kevin Ortiz's Flight Training",
  kind: "independent_cfi",
  defaultGuidanceMode: "guided",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  subscriptionQuantity: 1,
  demoExpiresAt: null,
  createdAt: new Date().toISOString(),
};

export const ORG_INDIVIDUAL_ALEX: Organization = {
  id: "org-individual-alex",
  name: "Alex Rivera's Flights",
  kind: "individual",
  defaultGuidanceMode: "freeform",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  subscriptionQuantity: 1,
  demoExpiresAt: null,
  createdAt: new Date().toISOString(),
};

export const ORG_MESA: Organization = {
  id: "org-mesa",
  name: "Mesa Flight Academy",
  kind: "school",
  defaultGuidanceMode: "guided",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  subscriptionQuantity: 1,
  demoExpiresAt: null,
  createdAt: new Date().toISOString(),
};

export const ORG_PRESCOTT: Organization = {
  id: "org-prescott",
  name: "Prescott Aviation",
  kind: "school",
  defaultGuidanceMode: "guided",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  subscriptionQuantity: 1,
  demoExpiresAt: null,
  createdAt: new Date().toISOString(),
};

// Real, receivable addresses (Gmail "+" aliasing -- same inbox, distinct
// identities) so the demo student/CFI logins actually work end-to-end with
// magic-link auth, not just placeholder emails no one can receive.
export const USER_ANDY: User = { id: "user-andy", name: "Andy", email: "andyrenk+student@gmail.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_DANNY: User = { id: "user-danny", name: "Danny Franks", email: "andyrenk+cfi@gmail.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_MARIA: User = { id: "user-maria", name: "Maria Chen", email: "maria@falconaviation.example", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_SARAH: User = { id: "user-sarah", name: "Sarah Miller", email: "sarah@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
// Real, receivable address (like Andy/Danny above). Jordan is the Falcon
// Aviation administrator and does not hold memberships at other schools.
export const USER_JORDAN: User = { id: "user-jordan", name: "Jordan Reyes", email: "andyrenk+admin@gmail.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

// Additional students spanning different training phases, for testing/demo
// variety -- early pattern work, post-solo cross-country, and checkride prep.
export const USER_MARCUS: User = { id: "user-marcus", name: "Marcus Webb", email: "marcus@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_PRIYA: User = { id: "user-priya", name: "Priya Anand", email: "priya@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_TOM: User = { id: "user-tom", name: "Tom Reilly", email: "tom@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

// Mia Chen: the canonical parity persona -- her story reproduces
// lib/prototype/vector-data.ts's fixture narrative (Mia/Jake/Dana, the
// crosswind + stabilized-approach arc) as real seeded rows, so
// /prototype/vector and Mia's real /home render the same story from two
// different data sources instead of two different stories that happen to
// share a component. See buildSeed() below for the flights/debrief/
// assessment data and app/dev/login/page.tsx for her login entry.
export const USER_MIA: User = { id: "user-mia", name: "Mia Chen", email: "mia@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_JAKE: User = { id: "user-jake", name: "Jake Alvarez", email: "jake@falconaviation.example", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_DANA: User = { id: "user-dana", name: "Dana Whitfield", email: "dana@falconaviation.example", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

// Independent CFI persona (real, receivable email like Andy/Danny) with a
// small roster of their own, entirely separate from Falcon Aviation.
export const USER_KEVIN: User = { id: "user-kevin", name: "Kevin Ortiz", email: "andyrenk+indycfi@gmail.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_EMMA: User = { id: "user-emma", name: "Emma Sato", email: "emma@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

// Individual (solo, no school) student persona -- real, receivable email.
export const USER_ALEX: User = { id: "user-alex", name: "Alex Rivera", email: "andyrenk+indystudent@gmail.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

// Mesa Flight Academy roster (one of the two extra "locations" for the
// multi-org admin demo -- see USER_JORDAN above).
export const USER_NINA: User = { id: "user-nina", name: "Nina Alvarez", email: "nina@mesaflight.example", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_CARLOS: User = { id: "user-carlos", name: "Carlos Mendez", email: "carlos@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_LEAH: User = { id: "user-leah", name: "Leah Kim", email: "leah@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

// Prescott Aviation roster (the third "location" for the multi-org admin demo).
export const USER_OMAR: User = { id: "user-omar", name: "Omar Haddad", email: "omar@prescottaviation.example", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };
export const USER_ZOE: User = { id: "user-zoe", name: "Zoe Bennett", email: "zoe@example.com", authUserId: null, avatarUrl: null, createdAt: new Date().toISOString() };

/** The default viewer when the app first loads (see lib/viewer.ts). */
export const DEMO_USER_ID = USER_ANDY.id;

export const SEED_AIRCRAFT: Aircraft = {
  id: "aircraft-da40-n123ab",
  tailNumber: "N123AB",
  type: "Diamond DA40 NG",
  make: "Diamond",
  model: "DA40 NG",
  homeAirport: "KFFZ",
  organizationId: ORG_FALCON.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const SARAH_AIRCRAFT: Aircraft = {
  id: "aircraft-c172-n731sp",
  tailNumber: "N731SP",
  type: "Cessna 172",
  make: "Cessna",
  model: "172",
  homeAirport: "KCHD",
  organizationId: ORG_FALCON.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const MARCUS_AIRCRAFT: Aircraft = {
  id: "aircraft-c152-n4521q",
  tailNumber: "N4521Q",
  type: "Cessna 152",
  make: "Cessna",
  model: "152",
  homeAirport: "KFFZ",
  organizationId: ORG_FALCON.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const TOM_AIRCRAFT: Aircraft = {
  id: "aircraft-da40-n456ct",
  tailNumber: "N456CT",
  type: "Diamond DA40 NG",
  make: "Diamond",
  model: "DA40 NG",
  homeAirport: "KFFZ",
  organizationId: ORG_FALCON.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const MIA_AIRCRAFT: Aircraft = {
  id: "aircraft-c172s-n4521p",
  tailNumber: "N4521P",
  type: "Cessna 172S",
  make: "Cessna",
  model: "172S",
  homeAirport: "KSQL",
  organizationId: ORG_FALCON.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const KEVIN_AIRCRAFT: Aircraft = {
  id: "aircraft-c172-n812kv",
  tailNumber: "N812KV",
  type: "Cessna 172",
  make: "Cessna",
  model: "172",
  homeAirport: "KDVT",
  organizationId: ORG_CFI_KEVIN.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const ALEX_AIRCRAFT: Aircraft = {
  id: "aircraft-c172-n905ar",
  tailNumber: "N905AR",
  type: "Cessna 172",
  make: "Cessna",
  model: "172",
  homeAirport: "KCHD",
  organizationId: ORG_INDIVIDUAL_ALEX.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const MESA_AIRCRAFT: Aircraft = {
  id: "aircraft-da40-n214ms",
  tailNumber: "N214MS",
  type: "Diamond DA40 NG",
  make: "Diamond",
  model: "DA40 NG",
  homeAirport: "KIWA",
  organizationId: ORG_MESA.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

const PRESCOTT_AIRCRAFT: Aircraft = {
  id: "aircraft-c172-n338pr",
  tailNumber: "N338PR",
  type: "Cessna 172",
  make: "Cessna",
  model: "172",
  homeAirport: "KPRC",
  organizationId: ORG_PRESCOTT.id,
  status: "active",
  externalProvider: null,
  externalId: null,
};

/**
 * Instructor is the lightweight lookup used for Flight.instructorId and for
 * matching literal names inside transcripts ("Danny had me..."). Its `name`
 * intentionally stays "Danny" (not "Danny Franks") because that's what the
 * seeded transcripts actually say -- the fuller name for rosters/CFI screens
 * lives on the User record instead. Instructor.id === User.id by convention.
 */
export const SEED_INSTRUCTOR: Instructor = {
  id: USER_DANNY.id,
  name: "Danny",
};

const SEED_INSTRUCTOR_MARIA: Instructor = {
  id: USER_MARIA.id,
  name: "Maria Chen",
};

const SEED_INSTRUCTOR_KEVIN: Instructor = {
  id: USER_KEVIN.id,
  name: "Kevin",
};

const SEED_INSTRUCTOR_NINA: Instructor = {
  id: USER_NINA.id,
  name: "Nina",
};

const SEED_INSTRUCTOR_OMAR: Instructor = {
  id: USER_OMAR.id,
  name: "Omar",
};

const SEED_INSTRUCTOR_JAKE: Instructor = {
  id: USER_JAKE.id,
  name: "Jake",
};

const SEED_INSTRUCTOR_DANA: Instructor = {
  id: USER_DANA.id,
  name: "Dana",
};

const FLIGHT_A_TRANSCRIPT =
  "We worked the traffic pattern for most of the flight. Danny had me focus on crosswind corrections on final. The first two landings were a little squirrelly in the crosswind, but I got the feel for it by the fourth one. Radio calls were solid today. We also reviewed the pattern altitudes for the class Delta airspace.";

const FLIGHT_B_TRANSCRIPT =
  "Today was mostly maneuvers work. We did steep turns at forty-five degrees, and I held altitude pretty well on most of them. Slow flight was good too, though I was a little slow to add power on the first recovery. Danny walked me through an engine-out simulation and had me pick a field and run the checklist. I need to work on talking on the radio more confidently during the emergency scenario.";

/** The exact transcript from the product brief -- used for the live demo flight. */
export const SEED_PENDING_TRANSCRIPT =
  "We started with some pattern work. My first landing was pretty rough. I was carrying too much speed and floated. The next two were better. Danny had me work on getting configured earlier. We also practiced a go-around. Radio calls were much better today, but I missed one instruction from tower and had to ask for a repeat.";

const SARAH_FLIGHT_TRANSCRIPT =
  "We worked slow flight and power-off stalls today. Danny had me slow down earlier before configuring for the stall. Checklist discipline was better this time. My steep turns still need work on holding altitude.";

// --- Marcus Webb: early student, first few hours in the pattern -------------
const MARCUS_FLIGHT_1_TRANSCRIPT =
  "First real lesson in the pattern today. My landings were pretty rough -- I was carrying too much speed on final and floated almost every time. Maria had me work on getting configured earlier in the pattern. Radio calls were rough too, I missed an instruction from tower and had to ask for a repeat. Traffic pattern altitude was inconsistent.";
const MARCUS_FLIGHT_2_TRANSCRIPT =
  "Back in the pattern again. Landings were better -- still floating a little on final but not as much as last time. Maria wants me to keep working on getting configured earlier and trimming for my approach speed. Radio calls were much better today, only needed one repeat. Traffic pattern altitude was more consistent this time.";

// --- Priya Anand: post-solo, working into cross-country -------------------
const PRIYA_FLIGHT_1_TRANSCRIPT =
  "First cross country dual today, KCHD to Casa Grande and back. Danny had me work pilotage the whole way out, checking my position against landmarks instead of just following the GPS. I got a little behind on my navigation log on the way out and missed a checkpoint. Coming back was better. We also practiced a diversion when Danny simulated deteriorating weather -- I need to work on picking a diversion airport faster.";
const PRIYA_FLIGHT_2_TRANSCRIPT =
  "Second cross country lesson, this one to Coolidge. Navigation log was much better this time, stayed on top of my checkpoints. The diversion drill went well too -- picked an airport and got a heading within a reasonable time. Danny wants me to keep working on fuel planning, I was a little optimistic on my time estimate for the return leg.";

// --- Tom Reilly: advanced student, checkride prep --------------------------
const TOM_FLIGHT_1_TRANSCRIPT =
  "Checkride prep session, worked the full private pilot maneuvers list. Steep turns were solid, held altitude within standards on both directions. Slow flight was good. Power-off stalls were fine but my power-on stall recovery was a little abrupt -- Danny wants smoother pitch input. We also did a short-field landing and I came in a bit long, need to nail my aim point better. Emergency procedures and checklist flow were sharp.";
const TOM_FLIGHT_2_TRANSCRIPT =
  "Another checkride prep flight. Steep turns and slow flight still solid. Power-on stall recovery was much smoother this time, good pitch control. Short-field landing was right on the aim point today. Danny said I'm about ready for the checkride -- just wants one more flight focused on emergency procedures under time pressure to build speed on the checklist flow.";

// --- Emma Sato: Kevin's own student (independent CFI roster) --------------
const EMMA_FLIGHT_TRANSCRIPT =
  "First lesson working the pattern together. Kevin had me focus on getting the airplane trimmed for approach speed before turning final. Landings were a little flat on the first two, better by the end. Radio calls were solid. Kevin wants me to keep working on configuring earlier in the downwind.";

// --- Alex Rivera: solo individual pilot, no CFI on the account -------------
const ALEX_FLIGHT_1_TRANSCRIPT =
  "Solo pattern practice today. My landings were mostly fine but I noticed I'm still carrying a bit of extra speed on short final. Going to work on trimming earlier and getting stabilized sooner. Radio calls went smoothly, no issues with tower today.";
const ALEX_FLIGHT_2_TRANSCRIPT =
  "Another solo session, worked steep turns and slow flight on my own out in the practice area. Altitude control on the steep turns was decent, lost about fifty feet on one of them. Slow flight recovery was clean. Want to keep building consistency on the steep turns before I fly with an instructor again for my flight review.";

// --- Mesa Flight Academy: Carlos Mendez and Leah Kim, both with Nina -------
const CARLOS_FLIGHT_TRANSCRIPT =
  "Pattern work today. Nina had me work on getting configured earlier on downwind so I'm not rushed on base. Landings were a little firm but on centerline. Radio calls were good, only needed one repeat from tower.";
const LEAH_FLIGHT_TRANSCRIPT =
  "Cross-country planning lesson followed by a short local flight. Nina walked through my navigation log with me before we launched -- my fuel planning was a little optimistic. In the air, pilotage was solid and I stayed on course the whole way. Need to build in more of a fuel reserve next time.";

// --- Prescott Aviation: Zoe Bennett, with Omar -----------------------------
const ZOE_FLIGHT_TRANSCRIPT =
  "Maneuvers flight -- steep turns, slow flight, and power-off stalls. Omar said my steep turns were solid on altitude but I rolled out a little late on both directions. Slow flight and stall recovery were clean. Omar wants me to work on anticipating the rollout point earlier next time.";

// --- Mia Chen: the canonical parity persona -- Dana handed off to Jake, and
// stabilized-approach speed is the weakness that survived the handover
// (mirrors lib/prototype/vector-data.ts's RECURRING). Crosswind landings
// carry both a wentWell and a needsWork sentence in the last two flights --
// real, not yet consistent -- which is what makes the third flight's
// student/instructor disagreement (below) a genuine reading of the same
// flight rather than an invented conflict.
// Short-field landings is deliberately phrased "short field APPROACH" (not
// "landing[s]") on flights 1 and 3: deriveStatus() in lib/skill-progress.ts
// derives a skill's status from only its single most recent signal, and
// "short-field landing" textually contains "landing" (Stabilized Approach's
// own keyword in lib/topics.ts), so a positive short-field mention on the
// LATEST flight would otherwise also read as a positive Stabilized Approach
// signal that day -- overwriting the real "still needs coaching" signal this
// story depends on. "short field approach" isn't in Stabilized Approach's
// keyword list, so it reads as a genuine, isolated Short-Field Landing
// signal on all three flights -- three consecutive, which is what lets it
// close out (Demonstrated) exactly like vector-data.ts's fixture, instead of
// sitting open next to the two skills the story is actually about. Traced
// and confirmed via lib/taxonomy.ts's classifyTrainingSignals().
const MIA_FLIGHT_1_TRANSCRIPT =
  "Landings today with Dana. Landings were rough -- you were carrying too much speed into short final a couple of times. Dana had me get configured earlier next time instead of fixing speed right at the runway. Your short field approach looked good, nice and controlled. Crosswind correction needs work -- you were behind the airplane and let it drift once you got into the flare. Radio calls were clear and confident all flight.";
const MIA_FLIGHT_2_TRANSCRIPT =
  "Pattern work with Jake today. You were carrying too much speed into two of the landings again, still fixing it late instead of configuring earlier. Jake wanted me to get stabilized well before the turn to final next time. Crosswind landings were better today -- centerline control improved. You still need to work on holding the crosswind correction through the flare. Short-field landings looked solid, nailed the aiming point on a couple of them. Radio calls stayed confident all flight.";
/** The flight the guided assessment below is attached to -- see seedMiaGuidedAssessment() in postgres-repository.ts for the real per-task ratings this transcript's summary gets paired with. */
const MIA_FLIGHT_3_TRANSCRIPT =
  "Crosswind and short-field landings with Jake today. Centerline control was much better. On the crosswind landings you still need to work on holding the correction once you get into the flare. You were also carrying too much speed into two of the landings. Your short field approach was solid again, right on the aiming point. Jake wanted me to keep working crosswinds and get stabilized earlier so I'm not trying to fix the speed at the threshold. I thought the crosswinds were actually going pretty well and liked keeping the airplane on centerline. Radio calls were clear and confident again.";

/**
 * flight-mia-3's real objectives -- the same 3 tasks vector-data.ts's
 * PERCEPTION_GAPS covers. Exported so postgres-repository.ts's
 * seedMiaGuidedAssessment() can insert the matching flight_tasks/
 * debrief_assessment_ratings rows without this list existing twice.
 */
// Labels match lib/topics.ts's TOPIC_LIBRARY topic strings exactly (not just
// approximately) -- that's the same catalog allTrainingSkills() exposes to a
// real CFI's task picker, so this is how a real guided debrief would
// actually label these, and it's what lets app/(product)/train/page.tsx
// reverse-match a stored AssessmentDifference.taskLabel back to a skill code
// for its ACS-area lookup.
export const MIA_ASSESSMENT_TASKS: { code: string; label: string }[] = [
  { code: "CROSSWIND_LANDING", label: "Crosswind landings" },
  { code: "STABILIZED_APPROACH", label: "Landings" },
  { code: "SHORT_FIELD_LANDING", label: "Short-field landings" },
];

/**
 * [task code, student rating, instructor rating]. Mirrors
 * vector-data.ts's PERCEPTION_GAPS exactly: Crosswind Landings is a real
 * disagreement (she rated herself Independent, Jake rated Needs Coaching --
 * distance 2, "significant"), the other two are real agreements.
 */
export const MIA_ASSESSMENT_RATINGS: { code: string; student: PerformanceLevelCode; instructor: PerformanceLevelCode }[] = [
  { code: "CROSSWIND_LANDING", student: "INDEPENDENT", instructor: "NEEDS_COACHING" },
  { code: "STABILIZED_APPROACH", student: "NEEDS_COACHING", instructor: "NEEDS_COACHING" },
  { code: "SHORT_FIELD_LANDING", student: "INDEPENDENT", instructor: "INDEPENDENT" },
];

// Three additional historical flights, further back than the preserved flight-1/2/3,
// used only to give the school-level Training Insights admin section (recurring
// deficiencies, carried-forward objectives) real non-empty data to demonstrate --
// they do not feed into flight-1/2/3's previousActionItems, so those three remain
// byte-identical to before this addition.
const FLIGHT_X1_TRANSCRIPT =
  "We spent the flight in the pattern working on landings. My approach speed was too fast on final and I floated a couple times. Danny wants me to pull power earlier and trim for the target speed. Otherwise a solid lesson.";

const FLIGHT_X2_TRANSCRIPT =
  "Back in the pattern again. Approach speed was better but I'm still carrying a little too much into the landing on short final. Need to keep working on that. Radio calls were good.";

const FLIGHT_X3_TRANSCRIPT =
  "Continued pattern work today. I keep coming in a bit fast on final and need to work on holding my approach speed into the landing. Everything else felt solid.";

function isoDate(daysAgoFromToday: number) {
  const today = new Date();
  const d = new Date(today.getTime() - daysAgoFromToday * 24 * 60 * 60 * 1000);
  return localIsoDate(d);
}

function todayAt(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Like todayAt, but N days out -- for a real upcoming reservation (Mia's "Thursday 9:00 AM") that stays in the future regardless of when the seed runs. */
function daysFromNowAt(daysFromNow: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function flightMetaFor(
  aircraft: Aircraft,
  instructor: Instructor,
  flight: Pick<Flight, "durationMinutes" | "flightDate" | "departureAirport" | "arrivalAirport">,
) {
  return {
    tailNumber: aircraft.tailNumber,
    aircraftType: aircraft.type,
    departureAirport: flight.departureAirport,
    arrivalAirport: flight.arrivalAirport,
    flightDate: flight.flightDate,
    durationMinutes: flight.durationMinutes,
    instructorName: instructor.name,
  };
}

export interface SeedBundle {
  organizations: Organization[];
  users: User[];
  organizationMembers: OrganizationMember[];
  studentInstructors: StudentInstructor[];
  aircraft: Aircraft[];
  /** Paired with organizationId since Instructor itself is intentionally org-agnostic (see its doc comment). */
  instructors: { instructor: Instructor; organizationId: string }[];
  reservations: Reservation[];
  flights: Flight[];
  debriefs: Debrief[];
  trainingItems: TrainingItem[];
  trainingSignals: TrainingSignal[];
}

export function buildSeed(): SeedBundle {
  const flightADate = isoDate(14); // Jul 29-ish
  const flightBDate = isoDate(7); // Aug 5-ish
  const flightCDate = isoDate(0); // today
  const sarahFlightDate = isoDate(3);

  const reservationAndy: Reservation = {
    id: "reservation-andy-today",
    organizationId: ORG_FALCON.id,
    studentId: USER_ANDY.id,
    instructorId: USER_DANNY.id,
    aircraftId: SEED_AIRCRAFT.id,
    scheduledStart: todayAt(15, 0),
    scheduledEnd: todayAt(16, 30),
    status: "scheduled",
    externalProvider: null,
    externalId: null,
  };

  const reservationSarah: Reservation = {
    id: "reservation-sarah-today",
    organizationId: ORG_FALCON.id,
    studentId: USER_SARAH.id,
    instructorId: USER_DANNY.id,
    aircraftId: SARAH_AIRCRAFT.id,
    scheduledStart: todayAt(17, 30),
    scheduledEnd: todayAt(19, 0),
    status: "scheduled",
    externalProvider: null,
    externalId: null,
  };

  // Mia's next lesson -- real, always a few days out, so /home's "Next
  // flight" state (the default /prototype/vector view) has something real
  // to show regardless of when this seed runs. Matches vector-data.ts's
  // NEXT_LESSON.focus ("Crosswind landings") in spirit; the literal weekday
  // won't say "Thursday" every time, which is an accepted, honest difference
  // from the frozen prototype copy.
  const reservationMia: Reservation = {
    id: "reservation-mia-next",
    organizationId: ORG_FALCON.id,
    studentId: USER_MIA.id,
    instructorId: USER_JAKE.id,
    aircraftId: MIA_AIRCRAFT.id,
    scheduledStart: daysFromNowAt(3, 9, 0),
    scheduledEnd: daysFromNowAt(3, 10, 30),
    status: "scheduled",
    externalProvider: null,
    externalId: null,
  };

  const flightA: Flight = {
    id: "flight-1",
    userId: USER_ANDY.id,
    organizationId: ORG_FALCON.id,
    aircraftId: SEED_AIRCRAFT.id,
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: flightADate,
    durationMinutes: 78,
    instructorId: SEED_INSTRUCTOR.id,
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: generatePatternTrack("KFFZ", { startTime: new Date(flightADate), durationMinutes: 78, seed: 1 }),
    createdAt: new Date(flightADate).toISOString(),
  };

  const flightB: Flight = {
    id: "flight-2",
    userId: USER_ANDY.id,
    organizationId: ORG_FALCON.id,
    aircraftId: SEED_AIRCRAFT.id,
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: flightBDate,
    durationMinutes: 82,
    instructorId: SEED_INSTRUCTOR.id,
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: generatePatternTrack("KFFZ", { startTime: new Date(flightBDate), durationMinutes: 82, seed: 2 }),
    createdAt: new Date(flightBDate).toISOString(),
  };

  const flightC: Flight = {
    id: "flight-3",
    userId: USER_ANDY.id,
    organizationId: ORG_FALCON.id,
    aircraftId: SEED_AIRCRAFT.id,
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: flightCDate,
    durationMinutes: 74,
    instructorId: SEED_INSTRUCTOR.id,
    reservationId: reservationAndy.id,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "not_started",
    track: generatePatternTrack("KFFZ", { startTime: new Date(flightCDate), durationMinutes: 74, seed: 3 }),
    createdAt: new Date(flightCDate).toISOString(),
  };

  const sarahFlight: Flight = {
    id: "flight-sarah-1",
    userId: USER_SARAH.id,
    organizationId: ORG_FALCON.id,
    aircraftId: SARAH_AIRCRAFT.id,
    departureAirport: "KCHD",
    arrivalAirport: "KCHD",
    flightDate: sarahFlightDate,
    durationMinutes: 68,
    instructorId: SEED_INSTRUCTOR.id,
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: generatePatternTrack("KCHD", { startTime: new Date(sarahFlightDate), durationMinutes: 68, seed: 4 }),
    createdAt: new Date(sarahFlightDate).toISOString(),
  };

  /** Builds a Flight + its analyzed Debrief for one of the additional student personas. */
  function studentDebrief(
    flightId: string,
    debriefId: string,
    student: User,
    aircraft: Aircraft,
    instructor: Instructor | null,
    daysAgo: number,
    durationMinutes: number,
    seed: number,
    transcript: string,
    audioDurationSeconds: number,
    previousActionItems: string[],
  ): { flight: Flight; debrief: Debrief; result: ReturnType<typeof analyzeMock> } {
    const flightDate = isoDate(daysAgo);
    const flight: Flight = {
      id: flightId,
      userId: student.id,
      organizationId: aircraft.organizationId,
      aircraftId: aircraft.id,
      departureAirport: aircraft.homeAirport,
      arrivalAirport: aircraft.homeAirport,
      flightDate,
      durationMinutes,
      instructorId: instructor?.id ?? null,
      reservationId: null,
      fr24FlightId: null,
      externalProvider: null,
      externalId: null,
      debriefStatus: "complete",
      track: generatePatternTrack(aircraft.homeAirport, { startTime: new Date(flightDate), durationMinutes, seed }),
      createdAt: new Date(flightDate).toISOString(),
    };
    const result = analyzeMock({
      transcript,
      flightMeta: instructor
        ? flightMetaFor(aircraft, instructor, flight)
        : { ...flightMetaFor(aircraft, { id: "self", name: "Self" }, flight), instructorName: "" },
      previousActionItems,
    });
    const debrief: Debrief = {
      id: debriefId,
      flightId: flight.id,
      transcript,
      audioDurationSeconds,
      structuredResult: result,
      analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
      createdAt: flight.createdAt,
    };
    return { flight, debrief, result };
  }

  const marcus1 = studentDebrief(
    "flight-marcus-1", "debrief-marcus-1", USER_MARCUS, MARCUS_AIRCRAFT, SEED_INSTRUCTOR_MARIA,
    10, 62, 20, MARCUS_FLIGHT_1_TRANSCRIPT, 82, [],
  );
  const marcus2 = studentDebrief(
    "flight-marcus-2", "debrief-marcus-2", USER_MARCUS, MARCUS_AIRCRAFT, SEED_INSTRUCTOR_MARIA,
    3, 65, 21, MARCUS_FLIGHT_2_TRANSCRIPT, 84, marcus1.result.actionItems,
  );

  const priya1 = studentDebrief(
    "flight-priya-1", "debrief-priya-1", USER_PRIYA, SARAH_AIRCRAFT, SEED_INSTRUCTOR,
    12, 118, 22, PRIYA_FLIGHT_1_TRANSCRIPT, 110, [],
  );
  const priya2 = studentDebrief(
    "flight-priya-2", "debrief-priya-2", USER_PRIYA, SARAH_AIRCRAFT, SEED_INSTRUCTOR,
    4, 124, 23, PRIYA_FLIGHT_2_TRANSCRIPT, 112, priya1.result.actionItems,
  );

  const tom1 = studentDebrief(
    "flight-tom-1", "debrief-tom-1", USER_TOM, TOM_AIRCRAFT, SEED_INSTRUCTOR,
    9, 96, 24, TOM_FLIGHT_1_TRANSCRIPT, 118, [],
  );
  const tom2 = studentDebrief(
    "flight-tom-2", "debrief-tom-2", USER_TOM, TOM_AIRCRAFT, SEED_INSTRUCTOR,
    2, 98, 25, TOM_FLIGHT_2_TRANSCRIPT, 120, tom1.result.actionItems,
  );

  // Mia Chen -- Dana, then Jake. Audio durations match
  // lib/prototype/vector-data.ts's DEBRIEFS fixture (1:31, 0:58, 1:12)
  // exactly; dates are real relative-to-today ones, not the frozen "Jul 18"/
  // "Aug 12"/"Aug 29" fixture strings -- an accepted, honest difference.
  const mia1 = studentDebrief(
    "flight-mia-1", "debrief-mia-1", USER_MIA, MIA_AIRCRAFT, SEED_INSTRUCTOR_DANA,
    18, 88, 40, MIA_FLIGHT_1_TRANSCRIPT, 91, [],
  );
  const mia2 = studentDebrief(
    "flight-mia-2", "debrief-mia-2", USER_MIA, MIA_AIRCRAFT, SEED_INSTRUCTOR_JAKE,
    10, 90, 41, MIA_FLIGHT_2_TRANSCRIPT, 58, mia1.result.actionItems,
  );

  // Mia's most recent flight -- guided mode, with a real per-task
  // disagreement (Crosswind Landings: she rated herself Independent, Jake
  // rated her Needs Coaching) and two real agreements (Stabilized Approach,
  // Short-Field Landing), mirroring vector-data.ts's PERCEPTION_GAPS. The
  // flight_tasks/debrief_assessments/debrief_assessment_ratings rows that
  // back this live in postgres-repository.ts's seedMiaGuidedAssessment(),
  // keyed off MIA_ASSESSMENT_TASKS/MIA_ASSESSMENT_RATINGS below -- this is
  // the one place assessmentDifferences is computed with the real
  // lib/debrief-cards/differences.ts function, not hand-typed, so it can
  // never drift from what those rating rows would actually produce.
  const mia3Date = isoDate(3);
  const flightMia3: Flight = {
    id: "flight-mia-3",
    userId: USER_MIA.id,
    organizationId: ORG_FALCON.id,
    aircraftId: MIA_AIRCRAFT.id,
    departureAirport: MIA_AIRCRAFT.homeAirport,
    arrivalAirport: MIA_AIRCRAFT.homeAirport,
    flightDate: mia3Date,
    durationMinutes: 84,
    instructorId: SEED_INSTRUCTOR_JAKE.id,
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: generatePatternTrack(MIA_AIRCRAFT.homeAirport, { startTime: new Date(mia3Date), durationMinutes: 84, seed: 42 }),
    createdAt: new Date(mia3Date).toISOString(),
  };
  const miaTaskLabels = new Map(MIA_ASSESSMENT_TASKS.map((t) => [t.code, t.label]));
  const miaStudentRatings = new Map<string, PerformanceLevelCode>(
    MIA_ASSESSMENT_RATINGS.map((r) => [r.code, r.student]),
  );
  const miaInstructorRatings = new Map<string, PerformanceLevelCode>(
    MIA_ASSESSMENT_RATINGS.map((r) => [r.code, r.instructor]),
  );
  const mia3Result = analyzeMock({
    transcript: MIA_FLIGHT_3_TRANSCRIPT,
    flightMeta: flightMetaFor(MIA_AIRCRAFT, SEED_INSTRUCTOR_JAKE, flightMia3),
    previousActionItems: mia2.result.actionItems,
  });
  mia3Result.assessmentDifferences = computeAssessmentDifferences(miaTaskLabels, miaStudentRatings, miaInstructorRatings);
  const debriefMia3: Debrief = {
    id: "debrief-mia-3",
    flightId: flightMia3.id,
    transcript: MIA_FLIGHT_3_TRANSCRIPT,
    audioDurationSeconds: 72,
    structuredResult: mia3Result,
    analyzedWith: "mock",
    guidanceMode: "guided",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: flightMia3.createdAt,
  };

  const emma1 = studentDebrief(
    "flight-emma-1", "debrief-emma-1", USER_EMMA, KEVIN_AIRCRAFT, SEED_INSTRUCTOR_KEVIN,
    5, 64, 30, EMMA_FLIGHT_TRANSCRIPT, 80, [],
  );

  const alex1 = studentDebrief(
    "flight-alex-1", "debrief-alex-1", USER_ALEX, ALEX_AIRCRAFT, null,
    11, 58, 31, ALEX_FLIGHT_1_TRANSCRIPT, 70, [],
  );
  const alex2 = studentDebrief(
    "flight-alex-2", "debrief-alex-2", USER_ALEX, ALEX_AIRCRAFT, null,
    4, 66, 32, ALEX_FLIGHT_2_TRANSCRIPT, 76, alex1.result.actionItems,
  );

  const carlos1 = studentDebrief(
    "flight-carlos-1", "debrief-carlos-1", USER_CARLOS, MESA_AIRCRAFT, SEED_INSTRUCTOR_NINA,
    6, 60, 33, CARLOS_FLIGHT_TRANSCRIPT, 78, [],
  );
  const leah1 = studentDebrief(
    "flight-leah-1", "debrief-leah-1", USER_LEAH, MESA_AIRCRAFT, SEED_INSTRUCTOR_NINA,
    8, 102, 34, LEAH_FLIGHT_TRANSCRIPT, 96, [],
  );
  const zoe1 = studentDebrief(
    "flight-zoe-1", "debrief-zoe-1", USER_ZOE, PRESCOTT_AIRCRAFT, SEED_INSTRUCTOR_OMAR,
    7, 68, 35, ZOE_FLIGHT_TRANSCRIPT, 82, [],
  );

  const flightX1Date = isoDate(35);
  const flightX2Date = isoDate(28);
  const flightX3Date = isoDate(21);

  function historicalFlight(id: string, flightDate: string, durationMinutes: number, seed: number): Flight {
    return {
      id,
      userId: USER_ANDY.id,
      organizationId: ORG_FALCON.id,
      aircraftId: SEED_AIRCRAFT.id,
      departureAirport: "KFFZ",
      arrivalAirport: "KFFZ",
      flightDate,
      durationMinutes,
      instructorId: SEED_INSTRUCTOR.id,
      reservationId: null,
      fr24FlightId: null,
      externalProvider: null,
      externalId: null,
      debriefStatus: "complete",
      track: generatePatternTrack("KFFZ", { startTime: new Date(flightDate), durationMinutes, seed }),
      createdAt: new Date(flightDate).toISOString(),
    };
  }

  const flightX1 = historicalFlight("flight-x1", flightX1Date, 70, 10);
  const flightX2 = historicalFlight("flight-x2", flightX2Date, 74, 11);
  const flightX3 = historicalFlight("flight-x3", flightX3Date, 76, 12);

  const debriefX1Result = analyzeMock({
    transcript: FLIGHT_X1_TRANSCRIPT,
    flightMeta: flightMetaFor(SEED_AIRCRAFT, SEED_INSTRUCTOR, flightX1),
    previousActionItems: [],
  });
  const debriefX1: Debrief = {
    id: "debrief-x1",
    flightId: flightX1.id,
    transcript: FLIGHT_X1_TRANSCRIPT,
    audioDurationSeconds: 90,
    structuredResult: debriefX1Result,
    analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: flightX1.createdAt,
  };

  const debriefX2Result = analyzeMock({
    transcript: FLIGHT_X2_TRANSCRIPT,
    flightMeta: flightMetaFor(SEED_AIRCRAFT, SEED_INSTRUCTOR, flightX2),
    previousActionItems: debriefX1Result.actionItems,
  });
  const debriefX2: Debrief = {
    id: "debrief-x2",
    flightId: flightX2.id,
    transcript: FLIGHT_X2_TRANSCRIPT,
    audioDurationSeconds: 92,
    structuredResult: debriefX2Result,
    analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: flightX2.createdAt,
  };

  const debriefX3Result = analyzeMock({
    transcript: FLIGHT_X3_TRANSCRIPT,
    flightMeta: flightMetaFor(SEED_AIRCRAFT, SEED_INSTRUCTOR, flightX3),
    previousActionItems: debriefX2Result.actionItems,
  });
  const debriefX3: Debrief = {
    id: "debrief-x3",
    flightId: flightX3.id,
    transcript: FLIGHT_X3_TRANSCRIPT,
    audioDurationSeconds: 94,
    structuredResult: debriefX3Result,
    analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: flightX3.createdAt,
  };

  const debriefAResult = analyzeMock({
    transcript: FLIGHT_A_TRANSCRIPT,
    flightMeta: flightMetaFor(SEED_AIRCRAFT, SEED_INSTRUCTOR, flightA),
    previousActionItems: [],
  });
  const debriefA: Debrief = {
    id: "debrief-1",
    flightId: flightA.id,
    transcript: FLIGHT_A_TRANSCRIPT,
    audioDurationSeconds: 96,
    structuredResult: debriefAResult,
    analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: flightA.createdAt,
  };

  const debriefBResult = analyzeMock({
    transcript: FLIGHT_B_TRANSCRIPT,
    flightMeta: flightMetaFor(SEED_AIRCRAFT, SEED_INSTRUCTOR, flightB),
    previousActionItems: debriefAResult.actionItems,
  });
  const debriefB: Debrief = {
    id: "debrief-2",
    flightId: flightB.id,
    transcript: FLIGHT_B_TRANSCRIPT,
    audioDurationSeconds: 104,
    structuredResult: debriefBResult,
    analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: flightB.createdAt,
  };

  const debriefSarahResult = analyzeMock({
    transcript: SARAH_FLIGHT_TRANSCRIPT,
    flightMeta: flightMetaFor(SARAH_AIRCRAFT, SEED_INSTRUCTOR, sarahFlight),
    previousActionItems: [],
  });
  const debriefSarah: Debrief = {
    id: "debrief-sarah-1",
    flightId: sarahFlight.id,
    transcript: SARAH_FLIGHT_TRANSCRIPT,
    audioDurationSeconds: 88,
    structuredResult: debriefSarahResult,
    analyzedWith: "mock",
    guidanceMode: "freeform",
    recordingStartedAt: null,
    recordingEndedAt: null,
    createdAt: sarahFlight.createdAt,
  };

  const newStudentDebriefs = [
    marcus1, marcus2, priya1, priya2, tom1, tom2, mia1, mia2,
    emma1, alex1, alex2, carlos1, leah1, zoe1,
  ];

  const trainingItems: TrainingItem[] = [
    ...toTrainingItems(flightX1.id, debriefX1.id, debriefX1Result, flightX1.createdAt),
    ...toTrainingItems(flightX2.id, debriefX2.id, debriefX2Result, flightX2.createdAt),
    ...toTrainingItems(flightX3.id, debriefX3.id, debriefX3Result, flightX3.createdAt),
    ...toTrainingItems(flightA.id, debriefA.id, debriefAResult, flightA.createdAt),
    ...toTrainingItems(flightB.id, debriefB.id, debriefBResult, flightB.createdAt),
    ...toTrainingItems(sarahFlight.id, debriefSarah.id, debriefSarahResult, sarahFlight.createdAt),
    ...toTrainingItems(flightMia3.id, debriefMia3.id, mia3Result, flightMia3.createdAt),
    ...newStudentDebriefs.flatMap((d) => toTrainingItems(d.flight.id, d.debrief.id, d.result, d.flight.createdAt)),
  ];

  const trainingSignals: TrainingSignal[] = [
    ...toTrainingSignals(flightX1, debriefX1.id, debriefX1Result),
    ...toTrainingSignals(flightX2, debriefX2.id, debriefX2Result),
    ...toTrainingSignals(flightX3, debriefX3.id, debriefX3Result),
    ...toTrainingSignals(flightA, debriefA.id, debriefAResult),
    ...toTrainingSignals(flightB, debriefB.id, debriefBResult),
    ...toTrainingSignals(sarahFlight, debriefSarah.id, debriefSarahResult),
    ...toTrainingSignals(flightMia3, debriefMia3.id, mia3Result),
    ...newStudentDebriefs.flatMap((d) => toTrainingSignals(d.flight, d.debrief.id, d.result)),
  ];

  const organizationMembers: OrganizationMember[] = [
    member("member-andy", USER_ANDY.id, "student"),
    // Danny also teaches at Mesa -- the multi-school CFI case, which is common
    // in practice and which nothing in the seed covered. Deliberately Danny
    // rather than Maria: his address is a real inbox, so the switch can be
    // tested through a live magic-link sign-in, not only via /dev/login.
    member("member-danny", USER_DANNY.id, "instructor"),
    member("member-danny-mesa", USER_DANNY.id, "instructor", ORG_MESA.id),
    member("member-maria", USER_MARIA.id, "instructor"),
    member("member-sarah", USER_SARAH.id, "student"),
    // Admin of all three locations -- the multi-org case the comment by
    // ORG_MESA already claimed. Only the Falcon row existed, so nothing in the
    // seed actually exercised switching between organizations.
    member("member-jordan", USER_JORDAN.id, "admin"),
    member("member-jordan-mesa", USER_JORDAN.id, "admin", ORG_MESA.id),
    member("member-jordan-prescott", USER_JORDAN.id, "admin", ORG_PRESCOTT.id),
    member("member-marcus", USER_MARCUS.id, "student"),
    member("member-priya", USER_PRIYA.id, "student"),
    member("member-tom", USER_TOM.id, "student"),
    member("member-mia", USER_MIA.id, "student"),
    member("member-jake", USER_JAKE.id, "instructor"),
    member("member-dana", USER_DANA.id, "instructor"),

    // Independent CFI: Kevin gets both admin + instructor rows (see
    // lib/auth/store.ts's resolveSignupOnLogin -- this seed mirrors what a
    // real independent_cfi signup produces), Emma is his one student.
    member("member-kevin-admin", USER_KEVIN.id, "admin", ORG_CFI_KEVIN.id),
    member("member-kevin-instructor", USER_KEVIN.id, "instructor", ORG_CFI_KEVIN.id),
    member("member-emma", USER_EMMA.id, "student", ORG_CFI_KEVIN.id),

    // Individual: Alex is a solo member of their own one-person org.
    member("member-alex", USER_ALEX.id, "student", ORG_INDIVIDUAL_ALEX.id),

    // Mesa Flight Academy: one instructor and two students.
    member("member-nina", USER_NINA.id, "instructor", ORG_MESA.id),
    member("member-carlos", USER_CARLOS.id, "student", ORG_MESA.id),
    member("member-leah", USER_LEAH.id, "student", ORG_MESA.id),

    // Prescott Aviation: one instructor and one student.
    member("member-omar", USER_OMAR.id, "instructor", ORG_PRESCOTT.id),
    member("member-zoe", USER_ZOE.id, "student", ORG_PRESCOTT.id),
  ];

  const studentInstructors: StudentInstructor[] = [
    link("link-andy-danny", USER_ANDY.id, USER_DANNY.id, true),
    link("link-andy-maria", USER_ANDY.id, USER_MARIA.id, false),
    link("link-sarah-danny", USER_SARAH.id, USER_DANNY.id, true),
    link("link-marcus-maria", USER_MARCUS.id, USER_MARIA.id, true),
    link("link-priya-danny", USER_PRIYA.id, USER_DANNY.id, true),
    link("link-tom-danny", USER_TOM.id, USER_DANNY.id, true),
    link("link-mia-dana", USER_MIA.id, USER_DANA.id, false),
    link("link-mia-jake", USER_MIA.id, USER_JAKE.id, true),
    link("link-emma-kevin", USER_EMMA.id, USER_KEVIN.id, true, ORG_CFI_KEVIN.id),
    link("link-carlos-nina", USER_CARLOS.id, USER_NINA.id, true, ORG_MESA.id),
    link("link-leah-nina", USER_LEAH.id, USER_NINA.id, true, ORG_MESA.id),
    link("link-zoe-omar", USER_ZOE.id, USER_OMAR.id, true, ORG_PRESCOTT.id),
  ];

  return {
    organizations: [ORG_FALCON, ORG_CFI_KEVIN, ORG_INDIVIDUAL_ALEX, ORG_MESA, ORG_PRESCOTT],
    users: [
      USER_ANDY, USER_DANNY, USER_MARIA, USER_SARAH, USER_JORDAN, USER_MARCUS, USER_PRIYA, USER_TOM,
      USER_MIA, USER_JAKE, USER_DANA,
      USER_KEVIN, USER_EMMA, USER_ALEX, USER_NINA, USER_CARLOS, USER_LEAH, USER_OMAR, USER_ZOE,
    ],
    organizationMembers,
    studentInstructors,
    aircraft: [
      SEED_AIRCRAFT, SARAH_AIRCRAFT, MARCUS_AIRCRAFT, TOM_AIRCRAFT, MIA_AIRCRAFT,
      KEVIN_AIRCRAFT, ALEX_AIRCRAFT, MESA_AIRCRAFT, PRESCOTT_AIRCRAFT,
    ],
    instructors: [
      { instructor: SEED_INSTRUCTOR, organizationId: ORG_FALCON.id },
      { instructor: SEED_INSTRUCTOR_MARIA, organizationId: ORG_FALCON.id },
      { instructor: SEED_INSTRUCTOR_JAKE, organizationId: ORG_FALCON.id },
      { instructor: SEED_INSTRUCTOR_DANA, organizationId: ORG_FALCON.id },
      { instructor: SEED_INSTRUCTOR_KEVIN, organizationId: ORG_CFI_KEVIN.id },
      { instructor: SEED_INSTRUCTOR_NINA, organizationId: ORG_MESA.id },
      { instructor: SEED_INSTRUCTOR_OMAR, organizationId: ORG_PRESCOTT.id },
    ],
    reservations: [reservationAndy, reservationSarah, reservationMia],
    flights: [
      flightC, flightB, flightA, flightX3, flightX2, flightX1, sarahFlight, flightMia3,
      ...newStudentDebriefs.map((d) => d.flight),
    ],
    debriefs: [
      debriefA, debriefB, debriefX1, debriefX2, debriefX3, debriefSarah, debriefMia3,
      ...newStudentDebriefs.map((d) => d.debrief),
    ],
    trainingItems,
    trainingSignals,
  };
}

function member(
  id: string,
  userId: string,
  role: OrganizationMember["role"],
  organizationId: string = ORG_FALCON.id,
): OrganizationMember {
  return {
    id,
    organizationId,
    userId,
    role,
    status: "active",
    certificateType: role === "student" ? "PRIVATE" : null,
    createdAt: new Date().toISOString(),
  };
}

function link(
  id: string,
  studentId: string,
  instructorId: string,
  isPrimary: boolean,
  organizationId: string = ORG_FALCON.id,
): StudentInstructor {
  return {
    id,
    studentId,
    instructorId,
    organizationId,
    isPrimary,
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

function toTrainingItems(
  flightId: string,
  debriefId: string,
  result: ReturnType<typeof analyzeMock>,
  createdAt: string,
): TrainingItem[] {
  const items: TrainingItem[] = [];
  let n = 0;
  for (const desc of result.needsWork) {
    items.push({
      id: `${debriefId}-keep-${n++}`,
      flightId,
      debriefId,
      category: "keep_working_on",
      description: desc,
      done: false,
      completedAt: null,
      visibility: "shared",
      createdAt,
    });
  }
  for (const desc of result.actionItems) {
    items.push({
      id: `${debriefId}-before-${n++}`,
      flightId,
      debriefId,
      category: "before_next_flight",
      description: desc,
      done: false,
      completedAt: null,
      visibility: "shared",
      createdAt,
    });
  }
  return items;
}

function toTrainingSignals(
  flight: Flight,
  debriefId: string,
  result: ReturnType<typeof analyzeMock>,
): TrainingSignal[] {
  const createdAt = flight.createdAt;
  return classifyTrainingSignals(result).map((draft, i) => ({
    ...draft,
    id: `${debriefId}-signal-${i}`,
    organizationId: flight.organizationId,
    studentId: flight.userId,
    instructorId: flight.instructorId,
    aircraftId: flight.aircraftId,
    flightId: flight.id,
    debriefId,
    flightDate: flight.flightDate,
    dismissed: false,
    createdAt,
  }));
}
