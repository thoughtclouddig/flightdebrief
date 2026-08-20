import type {
  Aircraft,
  AssessmentRole,
  CardDefinition,
  ConsentRecord,
  ConsentRole,
  ConsentStatus,
  Debrief,
  DebriefAssessment,
  DebriefAssessmentRating,
  DebriefCard,
  Flight,
  FlightTask,
  FlightTaskSource,
  FlightWithRelations,
  Instructor,
  Organization,
  OrganizationKind,
  OrganizationMember,
  OrgRole,
  RadioPracticeAssignment,
  Reservation,
  SkillObservation,
  StudentInstructor,
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

  listTrainingItems(filter?: ListTrainingItemsFilter): Promise<TrainingItem[]>;
  createTrainingItems(
    items: Omit<TrainingItem, "id" | "createdAt">[],
  ): Promise<TrainingItem[]>;
  setTrainingItemDone(id: string, done: boolean): Promise<void>;

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
  getUserByAuthId(authUserId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  createUser(input: { name: string; email: string; authUserId?: string | null }): Promise<User>;
  setUserAuthId(userId: string, authUserId: string): Promise<void>;
  getOrganization(id: string): Promise<Organization | null>;
  createOrganization(input: { id?: string; name: string; kind: OrganizationKind }): Promise<Organization>;
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

  // --- Reservations (read-only; produced by a SchedulingProvider) ---
  listReservations(filter?: ListReservationsFilter): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | null>;

  // --- Structured training signals (see lib/taxonomy.ts) ---
  createTrainingSignals(items: Omit<TrainingSignal, "id" | "createdAt">[]): Promise<TrainingSignal[]>;
  listTrainingSignals(filter?: ListTrainingSignalsFilter): Promise<TrainingSignal[]>;
  /** CFI authority (V1 change 14): excludes the signal from progression/aggregation without deleting it. */
  setTrainingSignalDismissed(id: string, dismissed: boolean): Promise<void>;

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
