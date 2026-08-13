import { generatePatternTrack } from "@/lib/geo";
import type { Aircraft, FlightWithRelations, Instructor } from "@/lib/types";

/**
 * Static example data for the public marketing site -- typed against the
 * same interfaces the real product uses, so marketing sections can render
 * the exact same components (FlightCard, CfiStudentCard, NextLessonFocusCard,
 * etc.) the real app renders, just fed demo props instead of a live repo.
 * Nothing here is queried from the database.
 */

export const DEMO_AIRCRAFT: Aircraft = {
  id: "demo-aircraft",
  tailNumber: "N428DM",
  type: "Diamond DA40 NG",
  make: "Diamond",
  model: "DA40 NG",
  homeAirport: "KFFZ",
  organizationId: null,
  status: "active",
  externalProvider: null,
  externalId: null,
};

export const DEMO_INSTRUCTOR: Instructor = { id: "demo-danny", name: "Danny" };

export const DEMO_FLIGHT: FlightWithRelations = {
  id: "demo-flight",
  userId: "demo-andy",
  organizationId: null,
  aircraftId: DEMO_AIRCRAFT.id,
  departureAirport: "KFFZ",
  arrivalAirport: "KFFZ",
  flightDate: "2026-08-12",
  durationMinutes: 74,
  instructorId: DEMO_INSTRUCTOR.id,
  reservationId: null,
  fr24FlightId: null,
  externalProvider: null,
  externalId: null,
  debriefStatus: "complete",
  track: generatePatternTrack("KFFZ", { startTime: new Date("2026-08-12T22:00:00Z"), durationMinutes: 74, laps: 3, seed: 42 }),
  createdAt: "2026-08-12T22:00:00Z",
  aircraft: DEMO_AIRCRAFT,
  instructor: DEMO_INSTRUCTOR,
};

export const DEMO_TRANSCRIPT_FRAGMENTS = [
  "First two approaches were fast.",
  "Last three were much better.",
  "Get configured earlier.",
  "Let's work on tower calls next time.",
];

export const DEMO_CONVERSATION = [
  { speaker: "CFI" as const, line: "Your first two approaches were fast. The last three were much better. Next time I want you configured earlier." },
  { speaker: "Student" as const, line: "I felt like I was chasing the airspeed on final." },
  { speaker: "CFI" as const, line: "Exactly. Let's work on that and have you handle all the tower calls." },
];

export const DEMO_STRUCTURED_DEBRIEF = {
  whatWeDid: ["Traffic pattern work", "Five landings", "One go-around", "Tower communications"],
  wentWell: ["Last three approaches were much better", "Radio confidence improved"],
  needsWork: ["Configure earlier on downwind", "Stabilize airspeed on final"],
  cfiGuidance: "“Last three approaches were much better. Continue getting configured earlier.”",
  actionItems: ["Review approach speeds", "Review short-field procedure", "Practice tower readbacks"],
};

export const DEMO_NEXT_LESSON_FOCUS = ["Stabilized Approaches", "Earlier Configuration", "Tower Communications"];
export const DEMO_BEFORE_YOU_FLY = ["Review approach speeds", "Review short-field procedure", "Practice tower readbacks"];

export const DEMO_STUDENT_PROGRESS = {
  improving: ["Radio Communications", "Pattern Consistency"],
  workingOn: ["Stabilized Approaches", "Crosswind Correction"],
  nextUp: ["Short-Field Landings"],
};

export const DEMO_CFI_STUDENTS = [
  {
    studentName: "Andy",
    timeLabel: "3:00 PM",
    tailNumber: "N428DM",
    aircraftType: "Diamond DA40 NG",
    focusAreas: ["Stabilized Approaches", "Short-Field Landings", "Tower Communications"],
  },
  {
    studentName: "Sarah",
    timeLabel: "5:30 PM",
    tailNumber: "N731SP",
    aircraftType: "Cessna 172",
    focusAreas: ["Slow flight & maneuvers"],
  },
];

export const DEMO_HANDOFF = {
  recentTraining: ["Pattern work", "Short-field landings", "Go-arounds"],
  currentFocus: ["Stabilized approaches", "Earlier configuration", "Tower communications"],
  lastNote: "“Last three approaches were much better. Continue getting configured earlier.”",
  plannedNextLesson: "Short-field work + student handles tower calls.",
};

export const DEMO_SCHOOL_STATS = [
  { label: "Active Students", value: 42, suffix: "" },
  { label: "CFIs", value: 8, suffix: "" },
  { label: "Flights This Month", value: 126, suffix: "" },
  { label: "Debriefs Completed", value: 89, suffix: "%" },
];

export const DEMO_TOP_ISSUES = [
  { label: "Stabilized Approaches", studentCount: 14 },
  { label: "Radio Readbacks", studentCount: 9 },
  { label: "Checklist Discipline", studentCount: 7 },
  { label: "Crosswind Correction", studentCount: 6 },
];

export const DEMO_INSIGHTS = {
  recurringDeficiencies: 6,
  carriedForward: 8,
  coverageGaps: 4,
};
