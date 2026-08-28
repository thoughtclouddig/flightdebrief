import type {
  Aircraft,
  Article,
  ArticleStatus,
  AssessmentRole,
  CardDefinition,
  ConsentRecord,
  ConsentRole,
  ConsentStatus,
  Debrief,
  PendingDebriefTranscript,
  DebriefAssessment,
  DebriefAssessmentRating,
  DebriefCard,
  Flight,
  FlightTask,
  FlightTaskSource,
  FlightWithRelations,
  Instructor,
  Milestone,
  Organization,
  OrganizationKind,
  OrganizationMember,
  OrgRole,
  RadioPracticeAssignment,
  ReferralEvent,
  ReferralSource,
  ReferralSummary,
  ResearchReport,
  Reservation,
  ResourceTopic,
  SkillObservation,
  Source,
  StudentInstructor,
  StudentNote,
  Subscription,
  TrainingCategory,
  TrainingItem,
  TrainingSignal,
  TrainingSkill,
  TranscriptSegment,
  User,
} from "@/lib/types";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

export interface CreateFlightInput {
  aircraftId: string;
  organizationId?: string | null;
  reservationId?: string | null;
  departureAirport: string;
  arrivalAirport: string;
  flightDate: string;
  durationMinutes: number;
  instructorId: string | null;
  fr24FlightId: string | null;
  externalProvider?: string | null;
  externalId?: string | null;
  track: Flight["track"];
  /** Defaults to the demo/current student when omitted -- see Repository.createFlight. */
  studentId?: string;
}

export interface CreateDebriefInput {
  flightId: string;
  transcript: string;
  audioDurationSeconds: number;
  structuredResult: Debrief["structuredResult"];
  analyzedWith: Debrief["analyzedWith"];
  /** Defaults to "freeform" (matches the DB column default) when omitted. */
  guidanceMode?: Debrief["guidanceMode"];
  recordingStartedAt?: string | null;
  recordingEndedAt?: string | null;
}

export interface ListFlightsFilter {
  studentId?: string;
  instructorId?: string;
  organizationId?: string;
}

export interface ListReservationsFilter {
  organizationId?: string;
  studentId?: string;
  instructorId?: string;
}

export interface UpdateReservationInput {
  scheduledStart?: string;
  scheduledEnd?: string;
  aircraftId?: string;
  instructorId?: string;
}

export interface ListTrainingSignalsFilter {
  organizationId?: string;
  studentId?: string;
  instructorId?: string;
  aircraftId?: string;
  skill?: TrainingSkill;
  category?: TrainingCategory;
}

export interface ListTrainingItemsFilter {
  flightId?: string;
  studentId?: string;
}

export interface CreateReservationInput {
  organizationId: string;
  studentId: string;
  instructorId: string;
  aircraftId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface CreateStudentNoteInput {
  organizationId: string;
  studentId: string;
  authorUserId: string;
  description: string;
}

export interface CreateArticleInput {
  slug: string;
  topicId: string | null;
  title: string;
  dek: string;
  body: string;
  authorName: string;
  sources?: Source[];
  imageUrl?: string | null;
}

export interface UpdateArticleInput {
  slug?: string;
  topicId?: string | null;
  title?: string;
  dek?: string;
  body?: string;
  authorName?: string;
  sources?: Source[];
  imageUrl?: string | null;
  status?: ArticleStatus;
}

export interface CreateResearchReportInput {
  slug: string;
  title: string;
  summary: string;
  keyFindings?: string | null;
  methodology?: string | null;
  sampleSize?: string | null;
  dateRange?: string | null;
  definitions?: string | null;
  limitations?: string | null;
  anonymizationNote?: string | null;
  dataSource?: string | null;
  authorName: string;
  reviewerName?: string | null;
  sources?: Source[];
  imageUrl?: string | null;
}

export interface UpdateResearchReportInput extends Partial<CreateResearchReportInput> {
  status?: ArticleStatus;
}

export interface CreateReferralEventInput {
  path: string;
  referrerSource: ReferralSource;
  referrerHost: string | null;
  rawReferrer: string | null;
}

/**
 * Data access boundary for the whole app, implemented by PostgresRepository
 * against the Replit Postgres database (DATABASE_URL, schema in
 * db/schema.sql) -- call sites never talk to the database directly.
 */
export interface Repository {
  listAircraft(organizationId?: string): Promise<Aircraft[]>;
  listInstructors(): Promise<Instructor[]>;
  getAircraft(id: string): Promise<Aircraft | null>;
  getInstructor(id: string): Promise<Instructor | null>;
  getOrCreateAircraft(input: {
    tailNumber: string;
    type: string;
    homeAirport: string;
    organizationId?: string | null;
  }): Promise<Aircraft>;
  getOrCreateInstructor(name: string, organizationId?: string | null): Promise<Instructor>;

  listFlights(filter?: ListFlightsFilter): Promise<FlightWithRelations[]>;
  getFlight(id: string): Promise<FlightWithRelations | null>;
  createFlight(input: CreateFlightInput): Promise<FlightWithRelations>;
  /** Cascades to its debrief, training items, and training signals (ON DELETE CASCADE). */
  deleteFlight(id: string): Promise<void>;
  setFlightDebriefStatus(id: string, status: Flight["debriefStatus"]): Promise<void>;

  getDebriefByFlight(flightId: string): Promise<Debrief | null>;
  createDebrief(input: CreateDebriefInput): Promise<Debrief>;
  /** Student-editable "next flight cue" -- lives inside structured_result jsonb, no separate column. */
  updateDebriefCue(debriefId: string, cue: string): Promise<void>;

  /** Upserts -- a re-recording or a resumed analysis attempt overwrites the previous pending row for this flight. */
  savePendingDebriefTranscript(input: Omit<PendingDebriefTranscript, "createdAt">): Promise<PendingDebriefTranscript>;
  getPendingDebriefTranscript(flightId: string): Promise<PendingDebriefTranscript | null>;
  deletePendingDebriefTranscript(flightId: string): Promise<void>;

  listTrainingItems(filter?: ListTrainingItemsFilter): Promise<TrainingItem[]>;
  createTrainingItems(
    items: Omit<TrainingItem, "id" | "createdAt">[],
  ): Promise<TrainingItem[]>;
  setTrainingItemDone(id: string, done: boolean): Promise<void>;
  /** CFI editing an AI-generated item's wording, or one they added themselves. */
  updateTrainingItemDescription(id: string, description: string): Promise<void>;
  deleteTrainingItem(id: string): Promise<void>;

  // --- CFI-authored standing student notes (independent of any flight/debrief) ---
  listStudentNotes(filter: { studentId: string }): Promise<StudentNote[]>;
  createStudentNote(input: CreateStudentNoteInput): Promise<StudentNote>;
  setStudentNoteDone(id: string, done: boolean): Promise<void>;

  // --- Content Engine Phase 1: public resources hub ---
  listResourceTopics(): Promise<ResourceTopic[]>;
  getResourceTopicBySlug(slug: string): Promise<ResourceTopic | null>;
  listArticles(filter: { status?: ArticleStatus; topicId?: string }): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  getArticle(id: string): Promise<Article | null>;
  createArticle(input: CreateArticleInput): Promise<Article>;
  updateArticle(id: string, input: UpdateArticleInput): Promise<Article>;

  // --- AI/LLM discoverability layer: original research ---
  listResearchReports(filter: { status?: ArticleStatus }): Promise<ResearchReport[]>;
  getResearchReportBySlug(slug: string): Promise<ResearchReport | null>;
  getResearchReport(id: string): Promise<ResearchReport | null>;
  createResearchReport(input: CreateResearchReportInput): Promise<ResearchReport>;
  updateResearchReport(id: string, input: UpdateResearchReportInput): Promise<ResearchReport>;

  // --- AI/LLM discoverability layer: referral tracking ---
  createReferralEvent(input: CreateReferralEventInput): Promise<ReferralEvent>;
  getReferralSummary(filter: { days: number }): Promise<ReferralSummary>;

  // --- Study-resource "opened" tracking (first-click only, no duration) ---
  markStudyResourceViewed(input: { studentId: string; url: string }): Promise<void>;
  listViewedStudyResourceUrls(studentId: string): Promise<string[]>;

  // --- Structured, CFI-led debrief: flight tasks ---
  listFlightTasks(flightId: string): Promise<FlightTask[]>;
  /** Replaces the flight's full task list -- the CFI's "Flight Complete" task picker is a single save, not incremental edits. */
  setFlightTasks(
    flightId: string,
    tasks: { taskCode: string; label: string; source: FlightTaskSource }[],
  ): Promise<FlightTask[]>;

  // --- Radio-communications practice ---
  createRadioPracticeAssignment(input: {
    organizationId: string;
    studentId: string;
    assignedBy: string | null;
    scenarioId: string;
  }): Promise<RadioPracticeAssignment>;
  listRadioPracticeAssignments(studentId: string): Promise<RadioPracticeAssignment[]>;
  getRadioPracticeAssignment(id: string): Promise<RadioPracticeAssignment | null>;
  completeRadioPracticeAssignment(
    id: string,
    result: { transcript: string; correct: boolean; matchedElements: { description: string; matched: boolean }[] },
  ): Promise<RadioPracticeAssignment>;
  deleteRadioPracticeAssignment(id: string): Promise<void>;

  // --- Structured, CFI-led debrief: independent assessments ---
  getOrCreateAssessment(flightId: string, role: AssessmentRole, assessorUserId: string): Promise<DebriefAssessment>;
  getAssessment(flightId: string, role: AssessmentRole): Promise<DebriefAssessment | null>;
  upsertAssessmentRating(
    assessmentId: string,
    flightTaskId: string,
    level: PerformanceLevelCode,
    note?: string | null,
  ): Promise<void>;
  listAssessmentRatings(assessmentId: string): Promise<DebriefAssessmentRating[]>;
  submitAssessment(assessmentId: string, overallReflection?: string | null): Promise<void>;

  // --- Structured, CFI-led debrief: question cards ---
  /** Merges org-scoped overrides over the global (organizationId null) defaults by `code`. */
  listCardDefinitions(organizationId?: string): Promise<CardDefinition[]>;
  listCards(flightId: string): Promise<DebriefCard[]>;
  createCards(cards: Omit<DebriefCard, "id" | "createdAt">[]): Promise<DebriefCard[]>;
  updateCardStatus(cardId: string, status: DebriefCard["status"]): Promise<void>;
  updateCardTiming(cardId: string, startSeconds: number, endSeconds: number): Promise<void>;
  setCardFlaggedForFollowUp(cardId: string, flagged: boolean): Promise<void>;
  reorderCards(orderedCardIds: string[]): Promise<void>;

  // --- Structured, CFI-led debrief: transcript segments ---
  createTranscriptSegments(
    segments: Omit<TranscriptSegment, "id" | "createdAt">[],
  ): Promise<TranscriptSegment[]>;
  listTranscriptSegments(flightId: string): Promise<TranscriptSegment[]>;

  // --- Identity / organizations ---
  getUser(id: string): Promise<User | null>;
  /** Sets one guide_progress key to true for a user -- fire-and-forget from the page that represents that milestone (see lib/guide.ts). */
  markGuideStepViewed(userId: string, key: string): Promise<void>;
  getUserByAuthId(authUserId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  createUser(input: { name: string; email: string; authUserId?: string | null }): Promise<User>;
  setUserAuthId(userId: string, authUserId: string): Promise<void>;
  getOrganization(id: string): Promise<Organization | null>;
  createOrganization(input: { id?: string; name: string; kind: OrganizationKind }): Promise<Organization>;
  getOrganizationByStripeCustomerId(stripeCustomerId: string): Promise<Organization | null>;
  /** Stripe is the source of truth for all of these -- only the webhook handler should call this. */
  updateOrganizationBilling(
    id: string,
    billing: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      subscriptionStatus?: string | null;
      subscriptionPlan?: Organization["subscriptionPlan"];
      subscriptionQuantity?: number;
    },
  ): Promise<Organization>;
  listOrganizations(): Promise<Organization[]>;
  listOrganizationsForUser(userId: string): Promise<Organization[]>;
  listMembers(organizationId: string, role?: OrgRole): Promise<OrganizationMember[]>;
  listMembershipsForUser(userId: string): Promise<OrganizationMember[]>;
  addMember(input: { organizationId: string; userId: string; role: OrgRole }): Promise<OrganizationMember>;
  setMemberStatus(memberId: string, status: OrganizationMember["status"]): Promise<void>;
  setMemberCertificateType(memberId: string, certificateType: OrganizationMember["certificateType"]): Promise<void>;

  // --- Student <-> instructor roster (many-to-many) ---
  listInstructorLinksForStudent(studentId: string): Promise<StudentInstructor[]>;
  listStudentLinksForInstructor(instructorId: string, organizationId?: string): Promise<StudentInstructor[]>;
  linkStudentInstructor(input: {
    studentId: string;
    instructorId: string;
    organizationId: string;
    isPrimary: boolean;
  }): Promise<StudentInstructor>;
  setStudentInstructorStatus(linkId: string, status: StudentInstructor["status"]): Promise<void>;

  // --- Reservations ---
  // Historically produced only by a SchedulingProvider/seed data (see
  // lib/scheduling/ -- still dormant, no real provider exists yet).
  // createReservation adds a second, app-originated source: a CFI scheduling
  // a lesson directly. A future real SchedulingProvider sync would become a
  // third writer into the same table, not a replacement for this one.
  listReservations(filter?: ListReservationsFilter): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | null>;
  createReservation(input: CreateReservationInput): Promise<Reservation>;
  /** Reschedule an existing lesson -- time, aircraft, and/or instructor. Partial: omitted fields keep their current value. */
  updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation | null>;
  /**
   * Cancels rather than deletes: the row stays with status "cancelled" so a
   * flight already linked to it (Flight.reservationId) doesn't end up pointing
   * at nothing, and so a school can still see that a slot was booked and
   * dropped rather than never existing.
   */
  cancelReservation(id: string): Promise<void>;

  // --- Structured training signals (see lib/taxonomy.ts) ---
  createTrainingSignals(items: Omit<TrainingSignal, "id" | "createdAt">[]): Promise<TrainingSignal[]>;
  listTrainingSignals(filter?: ListTrainingSignalsFilter): Promise<TrainingSignal[]>;
  /** CFI authority (V1 change 14): excludes the signal from progression/aggregation without deleting it. */
  setTrainingSignalDismissed(id: string, dismissed: boolean): Promise<void>;

  // --- Rewards Phase 1: milestones (see lib/milestones.ts) ---
  listMilestones(studentId: string): Promise<Milestone[]>;
  /** Insert-or-noop on (studentId, type); returns null when the milestone already existed (not newly awarded). */
  createMilestoneIfNew(input: Omit<Milestone, "id" | "createdAt" | "achievedAt">): Promise<Milestone | null>;

  // --- Recording consent (V1 change 12) ---
  createConsentRecord(input: {
    flightId: string;
    participantUserId: string;
    participantRole: ConsentRole;
    status: ConsentStatus;
  }): Promise<ConsentRecord>;
  listConsentRecords(flightId: string): Promise<ConsentRecord[]>;

  // --- Revenue share (V1 change 10) -- data relationships only, no payout engine ---
  /** Stub reader; there is no billing integration in this pass. Returns null when the user has no subscription row. */
  getSubscription(userId: string): Promise<Subscription | null>;
  /**
   * Reads qualifying debrief activity between a subscribing student and their
   * CFI/school within [periodStart, periodEnd] and returns the ids that would
   * qualify for revenue share -- never persists, never touches proficiency or
   * FlightScore. Enterprise orgs are excluded by the caller, not this method.
   */
  computeRevenueShareQualification(
    studentId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<{ qualifyingCfiId: string | null; qualifyingSchoolOrgId: string | null }>;

  /**
   * Every CFI-reviewed skill observation for a student -- flight_tasks joined
   * through debrief_assessments (role='instructor', status='submitted') and
   * debrief_assessment_ratings. This is FlightScore's only input (see
   * lib/flight-score.ts); freeform-mode flights and unsubmitted/student
   * assessments never appear here. Ordered oldest -> newest so callers can
   * take "most recent N per skill" without re-sorting.
   */
  listInstructorSkillObservations(studentId: string): Promise<SkillObservation[]>;
}
