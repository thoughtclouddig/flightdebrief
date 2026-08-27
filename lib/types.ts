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

/** Distinct from the unrelated Subscription/SubscriptionPlan types below (a pre-existing stub for a future CFI revenue-share feature, unconnected to real billing) -- this one is the actual Stripe-backed plan on an organization. */
export type BillingPlan = "pilot" | "school_pro";

export interface Organization {
  id: string;
  name: string;
  kind: OrganizationKind;
  /** One default guidance mode per org for now -- see DebriefGuidanceMode below. */
  defaultGuidanceMode: DebriefGuidanceMode;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /** Mirrors Stripe's own subscription status strings verbatim (active/past_due/canceled/etc.) -- null before a first checkout. Stripe is the source of truth; only the webhook handler writes this. */
  subscriptionStatus: string | null;
  subscriptionPlan: BillingPlan | null;
  /** Seat/location count for Flight School Pro's adjustable-quantity price; always 1 for Pilot. */
  subscriptionQuantity: number;
  /** Non-null only for public live-demo orgs (see lib/demo/live-demo-seed.ts) -- the cleanup cutoff, and doubles as the "is this a demo org" flag. Null for every real org. */
  demoExpiresAt: string | null;
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
  /** Small square photo as a data: URL, or null for the initials fallback. */
  avatarUrl: string | null;
  createdAt: string;
  /** One-off "have you seen this yet" flags for the AfterFlight Guide (lib/guide.ts) -- optional since most existing User literals (seed/test fixtures) predate this field. */
  guideProgress?: Record<string, boolean>;
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
 * A scheduled lesson -- either produced by a SchedulingProvider (e.g. Flight
 * Schedule Pro; see lib/scheduling/, still dormant/unimplemented) or created
 * directly by a CFI in-app (Repository.createReservation). App-originated
 * reservations leave externalProvider/externalId null; a future real
 * scheduling sync would be a second writer into this same table, not a
 * replacement for manual scheduling.
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
  /** The literal debrief sentence that triggered this match -- grounds the recommendation instead of inventing a reason. */
  why: string;
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
  /** Claude's natural-language spoken recap for the "Listen to your debrief" audio -- see lib/ai/prompt.ts. Empty string for older debriefs analyzed before this field existed, or a mock-analyzed one (falls back to the templated narration, see lib/debrief-narration.ts). */
  narrativeRecap: string;
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
  /** Short, memorable cockpit mnemonic for the next flight (e.g. "Airspeed → Flaps → Runway"). Editable by the student -- doubles as their "one thing to remember." Empty string for older debriefs analyzed before this field existed. */
  nextFlightCue: string;
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

/** A recording saved while billing-blocked, waiting to be analyzed once the org can pay -- see db/schema.sql's pending_debrief_transcripts for the full rationale. */
export interface PendingDebriefTranscript {
  flightId: string;
  transcript: string;
  audioDurationSeconds: number;
  guidanceMode: DebriefGuidanceMode;
  recordingStartedAt: string | null;
  recordingEndedAt: string | null;
  words: import("@/lib/transcription/types").TranscriptWord[] | null;
  cardBoundaries: import("@/lib/debrief-cards/segments").CardBoundary[] | null;
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

/**
 * A CFI-authored standing note about a student, independent of any specific
 * flight or debrief -- addable any time, unlike TrainingItem (which always
 * belongs to a completed debrief). Open notes surface as guaranteed debrief
 * cards next time that student debriefs, then get marked done automatically.
 */
export interface StudentNote {
  id: string;
  organizationId: string;
  studentId: string;
  authorUserId: string;
  description: string;
  done: boolean;
  completedAt: string | null;
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
  | "RISK_MANAGEMENT"
  // Rounding out takeoff/landing pairs and splitting ground reference
  // maneuvers into their individually-taught/graded elements (see
  // lib/topics.ts for why GROUND_REF_MANEUVERS itself stays as a generic
  // catch-all rather than being removed).
  | "SOFT_FIELD_LANDING"
  | "SOFT_FIELD_TAKEOFF"
  | "SHORT_FIELD_TAKEOFF"
  | "CROSSWIND_TAKEOFF"
  | "RECTANGULAR_COURSE"
  | "S_TURNS"
  | "TURNS_AROUND_POINT";

export type TrainingSignalStatus = "NEEDS_COACHING" | "IMPROVING";

/**
 * The V1 skill lifecycle vocabulary, derived at read time (see
 * lib/skill-progress.ts) from a skill's *sequence* of TrainingSignalStatus
 * values across flights -- never stored, since a single flight's signal can
 * only support the two raw statuses above, not a 5-way judgment.
 */
export type SkillProgressionStatus = "Introduced" | "Developing" | "Needs Coaching" | "Improving" | "Demonstrated";

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
  /** CFI-authority override (V1 change 14): excluded from progression/recurring-theme aggregation once true. Never deleted. */
  dismissed: boolean;
  createdAt: string;
}

// --- Recording consent (V1 change 12) --------------------------------------

export type ConsentRole = "student" | "instructor";
export type ConsentStatus = "granted" | "declined";

export interface ConsentRecord {
  id: string;
  flightId: string;
  participantUserId: string;
  participantRole: ConsentRole;
  status: ConsentStatus;
  recordedAt: string;
  createdAt: string;
}

// --- Revenue share (V1 change 10) -- data relationships only, no payout ----
// engine and no billing integration. See db/schema.sql for the full rationale.

export type SubscriptionPlan = "pilot" | "cfi" | "school";
export type SubscriptionStatus = "active" | "inactive";

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface RevenueShareQualification {
  id: string;
  subscribingStudentId: string;
  qualifyingCfiId: string | null;
  qualifyingSchoolOrgId: string | null;
  periodStart: string;
  periodEnd: string;
  cfiSharePct: number;
  schoolSharePct: number;
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
  /** A catalog TrainingSkill, or a "CUSTOM:<id>" code for a CFI-authored one-off task not in the fixed catalog -- see TaskPickerForm. Enforced in TypeScript only, same convention as training_signals.skill. */
  taskCode: TrainingSkill | (string & {});
  /** Denormalized display label at selection time, so relabeling the catalog later never rewrites history. */
  label: string;
  source: FlightTaskSource;
  sortOrder: number;
  createdAt: string;
}

/** One CFI-assigned (or self-assigned) radio-communications practice drill -- see lib/radio-practice-scenarios.ts for the scenario content itself. */
export interface RadioPracticeAssignment {
  id: string;
  organizationId: string;
  studentId: string;
  /** Null for a solo student's self-assigned practice. */
  assignedBy: string | null;
  /** References RadioScenario.id (lib/radio-practice-scenarios.ts), enforced in TypeScript only. */
  scenarioId: string;
  status: "assigned" | "completed";
  transcript: string | null;
  correct: boolean | null;
  /** Per-required-element pass/fail -- see lib/radio-practice-scoring.ts's RadioElementScore. */
  matchedElements: { description: string; matched: boolean }[] | null;
  /** How many times this has been submitted (see "Try Again") -- only the latest transcript/score is kept, this is just the count. */
  attempts: number;
  completedAt: string | null;
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
  /** See FlightTask.taskCode -- may be a custom code, not always a catalog TrainingSkill. */
  taskCode: TrainingSkill | (string & {});
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

export type MilestoneSource = "automatic" | "student_confirmed" | "cfi_confirmed";

/**
 * Rewards Phase 1: a recognized training milestone. `type` is an open string
 * namespace (see lib/milestones.ts), not a closed enum -- new milestone
 * types (first solo, checkride passed, etc.) are additive, never a schema
 * change. `metadata` holds only the small snapshot value a rule needs to
 * describe itself later (e.g. { streakLength: 10 }) -- never data that's
 * already reliably derivable from the related flight record.
 */
export interface Milestone {
  id: string;
  studentId: string;
  type: string;
  source: MilestoneSource;
  achievedAt: string;
  relatedFlightId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// --- Content Engine Phase 1: public resources hub --------------------------

export interface ResourceTopic {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export type ArticleStatus = "draft" | "published";

/**
 * A citation for a factual claim, tagged by what kind of claim it backs --
 * lets a reader (human or machine) tell an FAA requirement apart from an
 * AfterFlight recommendation instead of treating every link as equally
 * authoritative. Never imply an authority (FAA/NTSB/NASA) endorses
 * AfterFlight unless that's literally true.
 */
export type SourceType =
  | "faa_requirement"
  | "faa_guidance"
  | "ntsb"
  | "nasa"
  | "peer_reviewed_research"
  | "industry_standard"
  | "afterflight_research"
  | "expert_opinion"
  | "afterflight_recommendation"
  | "afterflight_capability";

export interface Source {
  label: string;
  url: string;
  sourceType: SourceType;
}

/** body is plain text, blank-line-separated paragraphs -- no markdown/MDX pipeline yet (Phase 2 concern). */
export interface Article {
  id: string;
  slug: string;
  topicId: string | null;
  title: string;
  dek: string;
  body: string;
  status: ArticleStatus;
  authorName: string;
  sources: Source[];
  /** https:// or data: URL -- see db/schema.sql's comment on articles.image_url. */
  imageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

// --- AI/LLM discoverability layer -------------------------------------------

/**
 * Original AfterFlight research from anonymized aggregate product data.
 * Narrative fields are nullable and left empty until real data exists --
 * never populate with fabricated findings.
 */
export interface ResearchReport {
  id: string;
  slug: string;
  title: string;
  summary: string;
  keyFindings: string | null;
  methodology: string | null;
  sampleSize: string | null;
  dateRange: string | null;
  definitions: string | null;
  limitations: string | null;
  anonymizationNote: string | null;
  dataSource: string | null;
  authorName: string;
  reviewerName: string | null;
  sources: Source[];
  imageUrl: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

/** Classified source of a marketing-site pageview's referrer -- see lib/ai-discovery/classify-referrer.ts. */
export type ReferralSource =
  | "chatgpt"
  | "perplexity"
  | "gemini"
  | "copilot"
  | "claude"
  | "bing"
  | "search_google"
  | "direct"
  | "other";

export interface ReferralEvent {
  id: string;
  path: string;
  referrerSource: ReferralSource;
  referrerHost: string | null;
  rawReferrer: string | null;
  createdAt: string;
}

export interface ReferralSummary {
  bySource: { source: ReferralSource; count: number }[];
  byPath: { path: string; source: ReferralSource; count: number }[];
}
