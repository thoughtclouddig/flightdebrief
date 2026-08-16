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
  /** One default guidance mode per org for now -- see DebriefGuidanceMode below. */
  defaultGuidanceMode: DebriefGuidanceMode;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Stable auth identity anchor (normalized email for magic-link sign-in); null until first login. See db/schema.sql. */
  authUserId: string | null;
  /** True once they've confirmed their name on the one-time onboarding form. */
  profileCompleted?: boolean;
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

/** One student/instructor perception gap, surfaced on the results page. Populated deterministically from debrief_assessment_ratings, never trusted from the LLM -- same "don't let the model reconstruct ground truth we already have" rule as studyReferences. */
export interface AssessmentDifference {
  taskLabel: string;
  studentLevel: import("@/lib/performance-levels").PerformanceLevelCode;
  instructorLevel: import("@/lib/performance-levels").PerformanceLevelCode;
  note: string;
}

export interface StructuredDebrief {
  /** Short summary of the lesson. Empty string for older debriefs analyzed before this field existed. */
  flightSummary: string;
  whatWeDid: string[];
  wentWell: string[];
  needsWork: string[];
  instructorGuidance: InstructorGuidance[];
  /** Factual "CFI intervened/prompted/corrected" observations -- distinct from instructorGuidance's verbatim attributed quotes. */
  instructorAssistance: string[];
  riskManagementNotes: string[];
  /** Empty for freeform-mode debriefs (no assessments exist to diff) and for older debriefs. */
  assessmentDifferences: AssessmentDifference[];
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
  /** Which flow produced this debrief. Defaults to "freeform" at the DB level for older rows. */
  guidanceMode: DebriefGuidanceMode;
  recordingStartedAt: string | null;
  recordingEndedAt: string | null;
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
  | "NAVIGATION"
  | "RISK_MANAGEMENT";

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
  | "NAVIGATION"
  // Added for the structured/guided debrief's flight-task catalog.
  | "NORMAL_TAKEOFF"
  | "GROUND_REF_MANEUVERS"
  | "RADIO_COMMUNICATIONS"
  | "SITUATIONAL_AWARENESS"
  | "RISK_MANAGEMENT";

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

// --- Structured, CFI-led debrief (guided/light modes) ----------------------
// Assessments and cards are created BEFORE a Debrief row exists (the debrief
// itself is still created once, at "End Debrief -> AI Processing", same as
// today) -- see db/schema.sql for the full rationale.

export type DebriefGuidanceMode = "guided" | "light" | "freeform";

export type FlightTaskSource = "instructor_selected" | "syllabus" | "ai_suggested" | "carried_over";

/** Which maneuvers/tasks were flown this flight, selected by the CFI at "Flight Complete". */
export interface FlightTask {
  id: string;
  flightId: string;
  taskCode: TrainingSkill;
  /** Denormalized display label at selection time, so relabeling the catalog later never rewrites history. */
  label: string;
  source: FlightTaskSource;
  sortOrder: number;
  createdAt: string;
}

export type AssessmentRole = "student" | "instructor";
export type AssessmentStatus = "in_progress" | "submitted";

/** One row per (flight, role) -- UNIQUE at the DB level, so "CFI can't see student's ratings until their own is submitted" is a plain query condition. */
export interface DebriefAssessment {
  id: string;
  flightId: string;
  role: AssessmentRole;
  assessorUserId: string;
  status: AssessmentStatus;
  submittedAt: string | null;
  overallReflection: string | null;
  createdAt: string;
}

export interface DebriefAssessmentRating {
  id: string;
  assessmentId: string;
  flightTaskId: string;
  performanceLevel: import("@/lib/performance-levels").PerformanceLevelCode;
  note: string | null;
  createdAt: string;
}

/**
 * One CFI-rated flight task, joined across flight_tasks + debrief_assessments
 * + debrief_assessment_ratings -- the fundamental unit FlightScore is built
 * from (see lib/flight-score.ts). Deliberately NOT a new persisted table:
 * the existing structured-debrief tables already carry everything this
 * needs, so this is a read-model produced by
 * Repository.listInstructorSkillObservations, not a new schema concept.
 *
 * Only rows from a role==="instructor" assessment with status==="submitted"
 * ever become a SkillObservation -- a CFI submitting their assessment *is*
 * the "instructor reviewed" signal for v1 (see AssessmentRole/AssessmentStatus
 * above). Student self-ratings and in-progress instructor drafts never
 * appear here, by construction, which is what keeps FlightScore's inputs to
 * "structured, instructor-supported data" only.
 */
export interface SkillObservation {
  flightId: string;
  /** Denormalized from the flight, same convention as TrainingSignal.flightDate. */
  flightDate: string;
  aircraftId: string;
  taskCode: TrainingSkill;
  /** Denormalized label at task-selection time -- see FlightTask.label. */
  taskLabel: string;
  performanceLevel: import("@/lib/performance-levels").PerformanceLevelCode;
  note: string | null;
  /** When the instructor's assessment was submitted -- the closest thing to a "reviewed at" timestamp today. */
  submittedAt: string;
}

export type CardCategory =
  | "OBJECTIVE"
  | "STRENGTHS"
  | "IMPROVEMENT"
  | "KEY_TASK"
  | "RISK_ADM"
  | "REFLECTION"
  | "NEXT_FLIGHT"
  | "DISCREPANCY"
  | "CUSTOM";

/** Reusable card template. organizationId null = system-global default; non-null = a school's override of the same `code` (Phase 3). */
export interface CardDefinition {
  id: string;
  organizationId: string | null;
  code: string;
  category: CardCategory;
  title: string;
  primaryPrompt: string;
  followUpPrompts: string[];
  appliesToTaskCode: TrainingSkill | null;
  defaultPriority: number;
  active: boolean;
  createdAt: string;
}

export type DebriefCardSource =
  | "standard"
  | "assessment_discrepancy"
  | "ai_generated"
  | "previous_flight_issue"
  | "instructor_selected"
  | "school_curriculum";

export type DiscrepancyStatus = "none" | "minor" | "significant";
export type DebriefCardStatus = "pending" | "active" | "completed" | "skipped";

/** A generated card instance for one flight's guided session. */
export interface DebriefCard {
  id: string;
  flightId: string;
  cardDefinitionId: string | null;
  flightTaskId: string | null;
  source: DebriefCardSource;
  category: CardCategory;
  title: string;
  primaryPrompt: string;
  followUpPrompts: string[];
  acsArea: string | null;
  acsAreaUrl: string | null;
  studentRating: import("@/lib/performance-levels").PerformanceLevelCode | null;
  instructorRating: import("@/lib/performance-levels").PerformanceLevelCode | null;
  discrepancyStatus: DiscrepancyStatus;
  sortOrder: number;
  status: DebriefCardStatus;
  flaggedForFollowUp: boolean;
  recordingStartSeconds: number | null;
  recordingEndSeconds: number | null;
  createdAt: string;
}

/** One transcript segment, flight-scoped rather than hard-tied to a card (a card's boundary can shift if the CFI goes Back). Null debriefCardId = freeform-mode session. */
export interface TranscriptSegment {
  id: string;
  flightId: string;
  debriefCardId: string | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  speakerLabel: string | null;
  createdAt: string;
}
