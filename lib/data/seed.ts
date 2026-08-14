import { generatePatternTrack } from "@/lib/geo";
import { analyzeMock } from "@/lib/ai/mock-analyzer";
import { localIsoDate } from "@/lib/date";
import { classifyTrainingSignals } from "@/lib/taxonomy";
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
  createdAt: new Date().toISOString(),
};

// Real, receivable addresses (Gmail "+" aliasing -- same inbox, distinct
// identities) so the demo student/CFI logins actually work end-to-end with
// magic-link auth, not just placeholder emails no one can receive.
export const USER_ANDY: User = { id: "user-andy", name: "Ron Johnson", email: "andyrenk+student@gmail.com", authUserId: null, createdAt: new Date().toISOString() };
export const USER_DANNY: User = { id: "user-danny", name: "Danny Franks", email: "andyrenk+cfi@gmail.com", authUserId: null, createdAt: new Date().toISOString() };
export const USER_MARIA: User = { id: "user-maria", name: "Maria Chen", email: "maria@falconaviation.example", authUserId: null, createdAt: new Date().toISOString() };
export const USER_SARAH: User = { id: "user-sarah", name: "Sarah Miller", email: "sarah@example.com", authUserId: null, createdAt: new Date().toISOString() };
export const USER_JORDAN: User = { id: "user-jordan", name: "Jordan Reyes", email: "jordan@falconaviation.example", authUserId: null, createdAt: new Date().toISOString() };

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

const FLIGHT_A_TRANSCRIPT =
  "We worked the traffic pattern for most of the flight. Danny had me focus on crosswind corrections on final. The first two landings were a little squirrelly in the crosswind, but I got the feel for it by the fourth one. Radio calls were solid today. We also reviewed the pattern altitudes for the class Delta airspace.";

const FLIGHT_B_TRANSCRIPT =
  "Today was mostly maneuvers work. We did steep turns at forty-five degrees, and I held altitude pretty well on most of them. Slow flight was good too, though I was a little slow to add power on the first recovery. Danny walked me through an engine-out simulation and had me pick a field and run the checklist. I need to work on talking on the radio more confidently during the emergency scenario.";

/** The exact transcript from the product brief -- used for the live demo flight. */
export const SEED_PENDING_TRANSCRIPT =
  "We started with some pattern work. My first landing was pretty rough. I was carrying too much speed and floated. The next two were better. Danny had me work on getting configured earlier. We also practiced a go-around. Radio calls were much better today, but I missed one instruction from tower and had to ask for a repeat.";

const SARAH_FLIGHT_TRANSCRIPT =
  "We worked slow flight and power-off stalls today. Danny had me slow down earlier before configuring for the stall. Checklist discipline was better this time. My steep turns still need work on holding altitude.";

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
  instructors: Instructor[];
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
    createdAt: sarahFlight.createdAt,
  };

  const trainingItems: TrainingItem[] = [
    ...toTrainingItems(flightX1.id, debriefX1.id, debriefX1Result, flightX1.createdAt),
    ...toTrainingItems(flightX2.id, debriefX2.id, debriefX2Result, flightX2.createdAt),
    ...toTrainingItems(flightX3.id, debriefX3.id, debriefX3Result, flightX3.createdAt),
    ...toTrainingItems(flightA.id, debriefA.id, debriefAResult, flightA.createdAt),
    ...toTrainingItems(flightB.id, debriefB.id, debriefBResult, flightB.createdAt),
    ...toTrainingItems(sarahFlight.id, debriefSarah.id, debriefSarahResult, sarahFlight.createdAt),
  ];

  const trainingSignals: TrainingSignal[] = [
    ...toTrainingSignals(flightX1, debriefX1.id, debriefX1Result),
    ...toTrainingSignals(flightX2, debriefX2.id, debriefX2Result),
    ...toTrainingSignals(flightX3, debriefX3.id, debriefX3Result),
    ...toTrainingSignals(flightA, debriefA.id, debriefAResult),
    ...toTrainingSignals(flightB, debriefB.id, debriefBResult),
    ...toTrainingSignals(sarahFlight, debriefSarah.id, debriefSarahResult),
  ];

  const organizationMembers: OrganizationMember[] = [
    member("member-andy", USER_ANDY.id, "student"),
    member("member-danny", USER_DANNY.id, "instructor"),
    member("member-maria", USER_MARIA.id, "instructor"),
    member("member-sarah", USER_SARAH.id, "student"),
    member("member-jordan", USER_JORDAN.id, "admin"),
  ];

  const studentInstructors: StudentInstructor[] = [
    link("link-andy-danny", USER_ANDY.id, USER_DANNY.id, true),
    link("link-andy-maria", USER_ANDY.id, USER_MARIA.id, false),
    link("link-sarah-danny", USER_SARAH.id, USER_DANNY.id, true),
  ];

  return {
    organizations: [ORG_FALCON],
    users: [USER_ANDY, USER_DANNY, USER_MARIA, USER_SARAH, USER_JORDAN],
    organizationMembers,
    studentInstructors,
    aircraft: [SEED_AIRCRAFT, SARAH_AIRCRAFT],
    instructors: [SEED_INSTRUCTOR, SEED_INSTRUCTOR_MARIA],
    reservations: [reservationAndy, reservationSarah],
    flights: [flightC, flightB, flightA, flightX3, flightX2, flightX1, sarahFlight],
    debriefs: [debriefA, debriefB, debriefX1, debriefX2, debriefX3, debriefSarah],
    trainingItems,
    trainingSignals,
  };
}

function member(id: string, userId: string, role: OrganizationMember["role"]): OrganizationMember {
  return {
    id,
    organizationId: ORG_FALCON.id,
    userId,
    role,
    status: "active",
    certificateType: role === "student" ? "PRIVATE" : null,
    createdAt: new Date().toISOString(),
  };
}

function link(id: string, studentId: string, instructorId: string, isPrimary: boolean): StudentInstructor {
  return {
    id,
    studentId,
    instructorId,
    organizationId: ORG_FALCON.id,
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
    createdAt,
  }));
}
