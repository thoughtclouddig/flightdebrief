import type {
  Aircraft,
  AssessmentRole,
  CardDefinition,
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
  OrganizationMember,
  OrgRole,
  Reservation,
  StudentInstructor,
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
    tasks: { taskCode: TrainingSkill; label: string; source: FlightTaskSource }[],
  ): Promise<FlightTask[]>;

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
}
