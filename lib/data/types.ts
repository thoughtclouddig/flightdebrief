import type {
  Aircraft,
  Debrief,
  Flight,
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
  User,
} from "@/lib/types";

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
  setFlightDebriefStatus(id: string, status: Flight["debriefStatus"]): Promise<void>;

  getDebriefByFlight(flightId: string): Promise<Debrief | null>;
  createDebrief(input: CreateDebriefInput): Promise<Debrief>;

  listTrainingItems(): Promise<TrainingItem[]>;
  createTrainingItems(
    items: Omit<TrainingItem, "id" | "createdAt">[],
  ): Promise<TrainingItem[]>;
  setTrainingItemDone(id: string, done: boolean): Promise<void>;

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
