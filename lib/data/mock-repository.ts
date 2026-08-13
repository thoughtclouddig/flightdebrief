import { randomUUID } from "crypto";
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
  TrainingItem,
  TrainingSignal,
  User,
} from "@/lib/types";
import { buildSeed, DEMO_USER_ID } from "./seed";
import type {
  CreateDebriefInput,
  CreateFlightInput,
  ListFlightsFilter,
  ListReservationsFilter,
  ListTrainingSignalsFilter,
  Repository,
} from "./types";

interface Store {
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

const globalForStore = globalThis as unknown as { __flightbriefStore?: Store };

function getStore(): Store {
  if (!globalForStore.__flightbriefStore) {
    const seed = buildSeed();
    globalForStore.__flightbriefStore = { ...seed };
    console.log("[Data] using in-memory MockRepository — configure Supabase env vars to use Postgres");
  }
  return globalForStore.__flightbriefStore;
}

function withRelations(flight: Flight, store: Store): FlightWithRelations {
  const aircraft = store.aircraft.find((a) => a.id === flight.aircraftId)!;
  const instructor = store.instructors.find((i) => i.id === flight.instructorId) ?? null;
  return { ...flight, aircraft, instructor };
}

export class MockRepository implements Repository {
  async listAircraft(organizationId?: string) {
    const all = getStore().aircraft;
    return organizationId ? all.filter((a) => a.organizationId === organizationId) : all;
  }

  async listInstructors() {
    return getStore().instructors;
  }

  async getAircraft(id: string) {
    return getStore().aircraft.find((a) => a.id === id) ?? null;
  }

  async getInstructor(id: string) {
    return getStore().instructors.find((i) => i.id === id) ?? null;
  }

  async getOrCreateAircraft(input: {
    tailNumber: string;
    type: string;
    homeAirport: string;
    organizationId?: string | null;
  }) {
    const store = getStore();
    const tail = input.tailNumber.toUpperCase();
    const existing = store.aircraft.find((a) => a.tailNumber.toUpperCase() === tail);
    if (existing) return existing;
    const [make, ...modelParts] = (input.type || "Unknown").split(" ");
    const aircraft: Aircraft = {
      id: randomUUID(),
      tailNumber: tail,
      type: input.type || "Unknown",
      make: make || "Unknown",
      model: modelParts.join(" ") || "",
      homeAirport: input.homeAirport || "",
      organizationId: input.organizationId ?? null,
      status: "active",
      externalProvider: null,
      externalId: null,
    };
    store.aircraft.push(aircraft);
    return aircraft;
  }

  async getOrCreateInstructor(name: string, organizationId?: string | null) {
    const store = getStore();
    const trimmed = name.trim();
    const existing = store.instructors.find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const instructor: Instructor = { id: randomUUID(), name: trimmed };
    void organizationId; // reserved: mock store keeps a flat instructor list, org-scoping is a Supabase-side concern
    store.instructors.push(instructor);
    return instructor;
  }

  async listFlights(filter?: ListFlightsFilter) {
    const store = getStore();
    let flights = store.flights;
    if (filter?.studentId) flights = flights.filter((f) => f.userId === filter.studentId);
    if (filter?.instructorId) flights = flights.filter((f) => f.instructorId === filter.instructorId);
    if (filter?.organizationId) flights = flights.filter((f) => f.organizationId === filter.organizationId);
    return [...flights]
      .sort((a, b) => b.flightDate.localeCompare(a.flightDate))
      .map((f) => withRelations(f, store));
  }

  async getFlight(id: string) {
    const store = getStore();
    const flight = store.flights.find((f) => f.id === id);
    return flight ? withRelations(flight, store) : null;
  }

  async createFlight(input: CreateFlightInput) {
    const store = getStore();
    const flight: Flight = {
      id: randomUUID(),
      userId: input.studentId ?? DEMO_USER_ID,
      organizationId: input.organizationId ?? null,
      aircraftId: input.aircraftId,
      departureAirport: input.departureAirport,
      arrivalAirport: input.arrivalAirport,
      flightDate: input.flightDate,
      durationMinutes: input.durationMinutes,
      instructorId: input.instructorId,
      reservationId: input.reservationId ?? null,
      fr24FlightId: input.fr24FlightId,
      externalProvider: input.externalProvider ?? null,
      externalId: input.externalId ?? null,
      debriefStatus: "not_started",
      track: input.track,
      createdAt: new Date().toISOString(),
    };
    store.flights.push(flight);
    return withRelations(flight, store);
  }

  async setFlightDebriefStatus(id: string, status: Flight["debriefStatus"]) {
    const store = getStore();
    const flight = store.flights.find((f) => f.id === id);
    if (flight) flight.debriefStatus = status;
  }

  async getDebriefByFlight(flightId: string) {
    const store = getStore();
    return store.debriefs.find((d) => d.flightId === flightId) ?? null;
  }

  async createDebrief(input: CreateDebriefInput) {
    const store = getStore();
    const debrief: Debrief = {
      id: randomUUID(),
      flightId: input.flightId,
      transcript: input.transcript,
      audioDurationSeconds: input.audioDurationSeconds,
      structuredResult: input.structuredResult,
      analyzedWith: input.analyzedWith,
      createdAt: new Date().toISOString(),
    };
    store.debriefs.push(debrief);
    return debrief;
  }

  async listTrainingItems() {
    return getStore().trainingItems;
  }

  async createTrainingItems(items: Omit<TrainingItem, "id" | "createdAt">[]) {
    const store = getStore();
    const createdAt = new Date().toISOString();
    const created = items.map((item) => ({ ...item, id: randomUUID(), createdAt }));
    store.trainingItems.push(...created);
    return created;
  }

  async setTrainingItemDone(id: string, done: boolean) {
    const store = getStore();
    const item = store.trainingItems.find((t) => t.id === id);
    if (item) {
      item.done = done;
      item.completedAt = done ? new Date().toISOString() : null;
    }
  }

  // --- Identity / organizations ---

  async getUser(id: string) {
    return getStore().users.find((u) => u.id === id) ?? null;
  }

  async listUsers() {
    return getStore().users;
  }

  async getOrganization(id: string) {
    return getStore().organizations.find((o) => o.id === id) ?? null;
  }

  async listOrganizations() {
    return getStore().organizations;
  }

  async listOrganizationsForUser(userId: string) {
    const store = getStore();
    const orgIds = new Set(store.organizationMembers.filter((m) => m.userId === userId).map((m) => m.organizationId));
    return store.organizations.filter((o) => orgIds.has(o.id));
  }

  async listMembers(organizationId: string, role?: OrgRole) {
    const members = getStore().organizationMembers.filter((m) => m.organizationId === organizationId);
    return role ? members.filter((m) => m.role === role) : members;
  }

  async listMembershipsForUser(userId: string) {
    return getStore().organizationMembers.filter((m) => m.userId === userId);
  }

  async createUser(input: { name: string; email: string }) {
    const store = getStore();
    const user: User = { id: randomUUID(), name: input.name, email: input.email, createdAt: new Date().toISOString() };
    store.users.push(user);
    return user;
  }

  async addMember(input: { organizationId: string; userId: string; role: OrgRole }) {
    const store = getStore();
    const member: OrganizationMember = {
      id: randomUUID(),
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      status: "active",
      certificateType: input.role === "student" ? "PRIVATE" : null,
      createdAt: new Date().toISOString(),
    };
    store.organizationMembers.push(member);
    return member;
  }

  async setMemberStatus(memberId: string, status: OrganizationMember["status"]) {
    const store = getStore();
    const member = store.organizationMembers.find((m) => m.id === memberId);
    if (member) member.status = status;
  }

  async setMemberCertificateType(memberId: string, certificateType: OrganizationMember["certificateType"]) {
    const store = getStore();
    const member = store.organizationMembers.find((m) => m.id === memberId);
    if (member) member.certificateType = certificateType;
  }

  // --- Student <-> instructor roster ---

  async listInstructorLinksForStudent(studentId: string) {
    return getStore().studentInstructors.filter((l) => l.studentId === studentId);
  }

  async listStudentLinksForInstructor(instructorId: string, organizationId?: string) {
    let links = getStore().studentInstructors.filter((l) => l.instructorId === instructorId);
    if (organizationId) links = links.filter((l) => l.organizationId === organizationId);
    return links;
  }

  async linkStudentInstructor(input: {
    studentId: string;
    instructorId: string;
    organizationId: string;
    isPrimary: boolean;
  }) {
    const store = getStore();
    const link: StudentInstructor = {
      id: randomUUID(),
      studentId: input.studentId,
      instructorId: input.instructorId,
      organizationId: input.organizationId,
      isPrimary: input.isPrimary,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    store.studentInstructors.push(link);
    return link;
  }

  async setStudentInstructorStatus(linkId: string, status: StudentInstructor["status"]) {
    const store = getStore();
    const link = store.studentInstructors.find((l) => l.id === linkId);
    if (link) link.status = status;
  }

  // --- Reservations ---

  async listReservations(filter?: ListReservationsFilter) {
    let reservations = getStore().reservations;
    if (filter?.organizationId) reservations = reservations.filter((r) => r.organizationId === filter.organizationId);
    if (filter?.studentId) reservations = reservations.filter((r) => r.studentId === filter.studentId);
    if (filter?.instructorId) reservations = reservations.filter((r) => r.instructorId === filter.instructorId);
    return [...reservations].sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  }

  async getReservation(id: string) {
    return getStore().reservations.find((r) => r.id === id) ?? null;
  }

  // --- Structured training signals ---

  async createTrainingSignals(items: Omit<TrainingSignal, "id" | "createdAt">[]) {
    const store = getStore();
    const createdAt = new Date().toISOString();
    const created = items.map((item) => ({ ...item, id: randomUUID(), createdAt }));
    store.trainingSignals.push(...created);
    return created;
  }

  async listTrainingSignals(filter?: ListTrainingSignalsFilter) {
    let signals = getStore().trainingSignals;
    if (filter?.organizationId) signals = signals.filter((s) => s.organizationId === filter.organizationId);
    if (filter?.studentId) signals = signals.filter((s) => s.studentId === filter.studentId);
    if (filter?.instructorId) signals = signals.filter((s) => s.instructorId === filter.instructorId);
    if (filter?.aircraftId) signals = signals.filter((s) => s.aircraftId === filter.aircraftId);
    if (filter?.skill) signals = signals.filter((s) => s.skill === filter.skill);
    if (filter?.category) signals = signals.filter((s) => s.category === filter.category);
    return [...signals].sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  }
}
