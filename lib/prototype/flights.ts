import { generatePatternTrack } from "@/lib/geo";
import type { TrackPosition } from "@/lib/types";
import { INSTRUCTOR, PRIOR_INSTRUCTOR, STUDENT } from "@/lib/prototype/vector-data";

/**
 * Flight as a first-class object in the prototype.
 *
 * Field names deliberately mirror the shipped `Flight` in lib/types.ts --
 * departureAirport, arrivalAirport, flightDate, durationMinutes, instructorId,
 * fr24FlightId, track, debriefStatus. That app already has a production flights
 * table, an FR24 provider abstraction, and a MapLibre track map; the prototype
 * lost the concept during the redesign, and the fix is to put it back on the
 * same shape rather than invent a parallel one. Swapping this module for
 * repo.listFlights() later is a single seam.
 *
 * The prototype adds two things the shipped model does not name explicitly:
 * a `source` provenance enum, and a `status` that covers the pre-confirmation
 * states an ADS-B match creates.
 */

/**
 * Where the flight record came from.
 *
 * Kept per-flight rather than per-field because the question that actually
 * gets asked is "did I type this or did AfterFlight find it?" -- and because
 * tracked hours must be able to say which of its hours were detected. The
 * shipped app carries the same distinction as `fr24FlightId` (a track exists)
 * plus `externalProvider`/`externalId` (the record came from elsewhere).
 */
export type FlightSource = "MANUAL" | "FR24" | "IMPORTED" | "DETECTED" | "SIMULATOR";

/**
 * PLANNED         on the schedule, hasn't happened
 * DETECTED        ADS-B found it; the student hasn't confirmed it is theirs
 * NEEDS_DEBRIEF   confirmed, flown, nothing captured yet
 * DEBRIEF_STARTED capture began and stopped partway
 * DEBRIEF_COMPLETE
 */
export type FlightStatus = "PLANNED" | "DETECTED" | "NEEDS_DEBRIEF" | "DEBRIEF_STARTED" | "DEBRIEF_COMPLETE";

export interface Flight {
  id: string;
  /** ISO date. */
  flightDate: string;
  /** Human label used everywhere the raw date would be noise. */
  dateLabel: string;
  departureAirport: string;
  arrivalAirport: string;
  aircraftType: string;
  tailNumber: string;
  /** Null for a solo flight. Solo is a first-class case, not a missing value. */
  instructor: string | null;
  durationMinutes: number;
  /** What the lesson was about. Free text, because that is how CFIs say it. */
  lesson: string;
  status: FlightStatus;
  source: FlightSource;
  /** Present only when an ADS-B lookup actually returned positions. */
  fr24FlightId: string | null;
  track: TrackPosition[] | null;
  /** The debrief this flight produced, when it has one. */
  debriefId: string | null;
}

/**
 * Real pattern tracks, from the same generator the shipped app's demo data
 * uses -- straight legs with rounded corners, not a smooth blob. Seeded per
 * flight so each one is distinguishable but stable across renders.
 */
function track(airport: string, minutes: number, seed: number): TrackPosition[] {
  return generatePatternTrack(airport, {
    startTime: new Date("2026-08-29T20:02:00Z"),
    durationMinutes: minutes,
    laps: Math.max(2, Math.round(minutes / 18)),
    seed,
  });
}

/**
 * Mia's flight history.
 *
 * Constructed so the numbers downstream are real rather than decorative:
 * tracked hours is the sum of these durations, "16 flights" is this length,
 * and the Aug 29 flight is the one every debrief, skill score and Vector
 * recommendation in the prototype refers to.
 */
export const FLIGHTS: Flight[] = [
  {
    id: "aug-29",
    flightDate: "2026-08-29",
    dateLabel: "Aug 29",
    departureAirport: "KSQL",
    arrivalAirport: "KSQL",
    aircraftType: "C172S",
    tailNumber: "N4521P",
    instructor: INSTRUCTOR.fullName,
    durationMinutes: 84,
    lesson: "Crosswind + Short Field",
    status: "DEBRIEF_COMPLETE",
    source: "FR24",
    fr24FlightId: "fr24-aug29",
    track: track("KSQL", 84, 11),
    debriefId: "latest",
  },
  {
    id: "aug-22",
    flightDate: "2026-08-22",
    dateLabel: "Aug 22",
    departureAirport: "KSQL",
    arrivalAirport: "KSQL",
    aircraftType: "C172S",
    tailNumber: "N4521P",
    instructor: INSTRUCTOR.fullName,
    durationMinutes: 66,
    lesson: "Pattern work + Go-arounds",
    status: "DEBRIEF_COMPLETE",
    source: "FR24",
    fr24FlightId: "fr24-aug22",
    track: track("KSQL", 66, 27),
    debriefId: "aug-12",
  },
  {
    id: "aug-15",
    flightDate: "2026-08-15",
    dateLabel: "Aug 15",
    departureAirport: "KSQL",
    arrivalAirport: "KHAF",
    aircraftType: "C172S",
    tailNumber: "N738KL",
    instructor: PRIOR_INSTRUCTOR.fullName,
    durationMinutes: 92,
    lesson: "Slow flight + Landings",
    status: "NEEDS_DEBRIEF",
    source: "FR24",
    fr24FlightId: "fr24-aug15",
    track: track("KSQL", 92, 43),
    debriefId: null,
  },
  {
    id: "aug-08",
    flightDate: "2026-08-08",
    dateLabel: "Aug 8",
    departureAirport: "KSQL",
    arrivalAirport: "KSQL",
    // Solo. No instructor, and nothing downstream should invent one.
    instructor: null,
    aircraftType: "C172S",
    tailNumber: "N4521P",
    durationMinutes: 48,
    lesson: "Solo pattern practice",
    status: "DEBRIEF_COMPLETE",
    source: "MANUAL",
    // Entered by hand, so there was never an ADS-B lookup to come back empty.
    fr24FlightId: null,
    track: null,
    debriefId: null,
  },
  {
    id: "jul-18",
    flightDate: "2026-07-18",
    dateLabel: "Jul 18",
    departureAirport: "KSQL",
    arrivalAirport: "KSQL",
    aircraftType: "C172S",
    tailNumber: "N738KL",
    instructor: PRIOR_INSTRUCTOR.fullName,
    durationMinutes: 78,
    lesson: "Landings",
    status: "DEBRIEF_COMPLETE",
    source: "FR24",
    fr24FlightId: "fr24-jul18",
    track: track("KSQL", 78, 61),
    debriefId: "jul-18",
  },
];

/**
 * A flight ADS-B has matched but the student has not confirmed.
 *
 * This is the state the shipped app cannot currently reach -- the FR24 client
 * exists but nothing polls for a landing -- so it is seeded rather than fetched.
 * The shape is exactly what `FlightCandidate` (lib/flight-data/types.ts)
 * returns, so wiring it to the live provider is a swap, not a rewrite.
 */
export const DETECTED_FLIGHT = {
  providerFlightId: "fr24-today",
  tailNumber: "N4521P",
  aircraftType: "C172S",
  departureAirport: "KSQL",
  arrivalAirport: "KSQL",
  dateLabel: "Today",
  departedAt: "1:02 PM",
  landedAt: "2:14 PM",
  durationMinutes: 78,
  track: track("KSQL", 78, 91),
} as const;

/** Recent values, so Add Flight is confirmation rather than data entry. */
export const FLIGHT_DEFAULTS = {
  homeAirport: "KSQL",
  recentAircraft: [
    { tailNumber: "N4521P", type: "C172S" },
    { tailNumber: "N738KL", type: "C172S" },
  ],
  recentInstructors: [INSTRUCTOR.fullName, PRIOR_INSTRUCTOR.fullName],
  recentLessons: ["Crosswind + Short Field", "Pattern work", "Landings", "Navigation"],
} as const;

/* ------------------------------------------------------------- derivations */

export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/**
 * Tracked hours.
 *
 * Every confirmed flight counts, detected or hand-entered, because the student
 * confirmed both. What it is NOT is logged time: this number has never been
 * near a logbook, an endorsement or a currency calculation, and the copy
 * everywhere it appears says so. See TRACKED_HOURS_DISCLAIMER.
 */
export function trackedMinutes(flights: Flight[] = FLIGHTS): number {
  return flights.filter((f) => f.status !== "PLANNED" && f.status !== "DETECTED").reduce((n, f) => n + f.durationMinutes, 0);
}

export function trackedHours(flights: Flight[] = FLIGHTS): string {
  return formatHours(trackedMinutes(flights));
}

/** Kept in one place so the wording cannot drift between screens. */
export const TRACKED_HOURS_DISCLAIMER =
  "Tracked hours are based on flights detected or confirmed in AfterFlight. They are not a substitute for your official pilot logbook.";

export function flightById(id: string): Flight | undefined {
  return FLIGHTS.find((f) => f.id === id);
}

/** The most recent flight with nothing captured against it. */
export function flightNeedingDebrief(flights: Flight[] = FLIGHTS): Flight | undefined {
  return flights.find((f) => f.status === "NEEDS_DEBRIEF" || f.status === "DEBRIEF_STARTED");
}

export function statusLabel(status: FlightStatus): string {
  switch (status) {
    case "PLANNED":
      return "Planned";
    case "DETECTED":
      return "Not confirmed";
    case "NEEDS_DEBRIEF":
      return "Needs debrief";
    case "DEBRIEF_STARTED":
      return "Debrief started";
    case "DEBRIEF_COMPLETE":
      return "Debrief complete";
  }
}

/** Shown only where provenance answers a question the student is asking. */
export function sourceLabel(flight: Flight): string {
  switch (flight.source) {
    case "FR24":
    case "DETECTED":
      return "Flight details detected from flight tracking";
    case "IMPORTED":
      return "Flight details imported";
    case "SIMULATOR":
      return "Simulator session";
    case "MANUAL":
      return "Flight details entered manually";
  }
}

export { STUDENT };
