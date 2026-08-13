export type DebriefStatus = "not_started" | "in_progress" | "complete";

/**
 * Instructor is a lightweight, denormalized lookup (id, name) kept for
 * backward compatibility with Flight.instructorId. When an instructor is a
 * registered platform user, Instructor.id === User.id by convention -- there
 * is no separate "instructor profile" table; role-specific data lives on
 * OrganizationMember instead.
 */
export interface Instructor {
  id: string;
  name: string;
}

export type AircraftStatus = "active" | "inactive" | "maintenance";

export interface Aircraft {
  id: string;
  tailNumber: string;
  /** Derived display string, e.g. "Diamond DA40 NG" -- kept for backward compat. */
  type: string;
  make: string;
  model: string;
  homeAirport: string;
  organizationId: string | null;
  status: AircraftStatus;
  externalProvider: string | null;
  externalId: string | null;
}

export type OrganizationKind = "individual" | "independent_cfi" | "school";

export interface Organization {
  id: string;
  name: string;
  kind: OrganizationKind;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type OrgRole = "student" | "instructor" | "admin";
export type MembershipStatus = "active" | "inactive";

/** Which FAA certificate a student is training toward. Only Private is wired up today (see lib/acs.ts) -- extension point for Instrument/Commercial later. */
export type CertificateType = "PRIVATE";

/**
 * A user's role within an organization. A user can hold multiple memberships
 * (multiple orgs, and/or multiple roles across orgs) -- this is how one
 * account can be both an independent CFI and a school-employed CFI, or a
 * student who later becomes an instructor, without duplicate accounts.
 */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  status: MembershipStatus;
  /** Only meaningful for role === "student"; null for instructor/admin rows. */
  certificateType: CertificateType | null;
  createdAt: string;
}

/**
 * Explicit many-to-many roster relationship between a student and an
 * instructor -- separate from a specific flight's single instructorId.
 * A student's training history belongs to the student, not to any one row
 * here; this table only tracks who currently/previously works with whom.
 */
export interface StudentInstructor {
  id: string;
  studentId: string;
  instructorId: string;
  organizationId: string;
  isPrimary: boolean;
  status: MembershipStatus;
  createdAt: string;
}

export type ReservationStatus = "scheduled" | "completed" | "cancelled";

/**
 * A scheduled lesson, sourced from a SchedulingProvider (e.g. Flight Schedule
 * Pro) or seed data. Read-only from this app's perspective -- it exists only
 * to give the debrief experience operational context (who/when/what
 * aircraft), never to manage scheduling itself.
 */
export interface Reservation {
  id: string;
  organizationId: string;
  studentId: string;
  instructorId: string;
  aircraftId: string;
  /** ISO datetime */
  scheduledStart: string;
  /** ISO datetime */
  scheduledEnd: string;
  status: ReservationStatus;
  externalProvider: string | null;
  externalId: string | null;
}

export interface TrackPosition {
  lat: number;
  lon: number;
  altitudeFt?: number;
  groundSpeedKt?: number;
  timestamp: string;
}

export interface Flight {
  id: string;
  /** The student who flew -- named userId for historical/minimal-diff reasons. */
  userId: string;
  organizationId: string | null;
  aircraftId: string;
  departureAirport: string;
  arrivalAirport: string;
  /** ISO date, e.g. 2026-08-12 */
  flightDate: string;
  durationMinutes: number;
  instructorId: string | null;
  reservationId: string | null;
  /** FR24 ADS-B track id -- separate concern from the record-origin fields below. */
  fr24FlightId: string | null;
  /** Where this flight *record* originated, e.g. "flight_schedule_pro". Distinct from ADS-B track sourcing. */
  externalProvider: string | null;
  externalId: string | null;
  debriefStatus: DebriefStatus;
  track: TrackPosition[] | null;
  createdAt: string;
}

export interface InstructorGuidance {
  instructorName: string;
  quote: string;
}

export interface StudyReference {
  topic: string;
  source: string;
  url: string;
}

export interface StructuredDebrief {
  whatWeDid: string[];
  wentWell: string[];
  needsWork: string[];
  instructorGuidance: InstructorGuidance[];
  actionItems: string[];
  nextLessonFocus: string[];
  studyReferences: StudyReference[];
}

export interface Debrief {
  id: string;
  flightId: string;
  transcript: string;
  audioDurationSeconds: number;
  structuredResult: StructuredDebrief;
  analyzedWith: "claude" | "mock";
  createdAt: string;
}

export type TrainingItemCategory = "keep_working_on" | "before_next_flight" | "todo";

/** Who can see this item. Defaults to "shared" -- everything from a debrief is student-visible by default. */
export type TrainingItemVisibility = "shared" | "instructor_only" | "admin_only";

export interface TrainingItem {
  id: string;
  flightId: string;
  debriefId: string;
  category: TrainingItemCategory;
  description: string;
  done: boolean;
  completedAt: string | null;
  visibility: TrainingItemVisibility;
  createdAt: string;
}

/** Flight enriched with the joined fields views typically need. */
export interface FlightWithRelations extends Flight {
  aircraft: Aircraft;
  instructor: Instructor | null;
}

// --- Structured training signals ------------------------------------------
// A normalized layer under the narrative StructuredDebrief above: every
// debrief also produces a handful of tagged TrainingSignal rows so a school
// can eventually aggregate "what are students struggling with" without
// re-parsing free text. See lib/taxonomy.ts for the classifier and
// lib/training-insights.ts for school-level aggregation.

export type TrainingCategory =
  | "LANDINGS"
  | "MANEUVERS"
  | "COMMUNICATIONS"
  | "PROCEDURES"
  | "AIRSPEED_CONTROL"
  | "NAVIGATION";

export type TrainingSkill =
  | "STABILIZED_APPROACH"
  | "SHORT_FIELD_LANDING"
  | "CROSSWIND_LANDING"
  | "GO_AROUND"
  | "TRAFFIC_PATTERN"
  | "STEEP_TURNS"
  | "SLOW_FLIGHT"
  | "STALLS"
  | "EMERGENCY_PROCEDURES"
  | "CHECKLIST_DISCIPLINE"
  | "TOWER_READBACKS"
  | "AIRSPEED_CONTROL"
  | "NAVIGATION";

export type TrainingSignalStatus = "NEEDS_WORK" | "IMPROVING";

/**
 * Who the observation can be attributed to. Honestly conservative: a single
 * unlabeled transcript can't reliably separate student vs. instructor
 * speech, so heuristic classification always records STUDENT_AND_INSTRUCTOR
 * rather than guessing a single speaker.
 */
export type TrainingSignalSource = "STUDENT" | "INSTRUCTOR" | "STUDENT_AND_INSTRUCTOR";

export interface TrainingSignal {
  id: string;
  organizationId: string | null;
  studentId: string;
  instructorId: string | null;
  aircraftId: string | null;
  flightId: string;
  debriefId: string;
  /** Denormalized from the flight so date-range/skill aggregation doesn't require a join. */
  flightDate: string;
  category: TrainingCategory;
  skill: TrainingSkill;
  status: TrainingSignalStatus;
  source: TrainingSignalSource;
  /** The original sentence this was classified from, preserved verbatim -- never overwritten. */
  statement: string;
  createdAt: string;
}
