import type { SupabaseClient } from "@supabase/supabase-js";
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
import type {
  CreateDebriefInput,
  CreateFlightInput,
  ListFlightsFilter,
  ListReservationsFilter,
  ListTrainingSignalsFilter,
  Repository,
} from "./types";

/**
 * Repository backed by real Supabase/Postgres tables (see supabase/schema.sql).
 * Implements the exact same interface as MockRepository so no call sites
 * change when Supabase credentials are added.
 */
export class SupabaseRepository implements Repository {
  constructor(private readonly db: SupabaseClient) {}

  async listAircraft(organizationId?: string): Promise<Aircraft[]> {
    let query = this.db.from("aircraft").select("*");
    if (organizationId) query = query.eq("organization_id", organizationId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapAircraft);
  }

  async listInstructors(): Promise<Instructor[]> {
    const { data, error } = await this.db.from("instructors").select("*");
    if (error) throw error;
    return (data ?? []).map(mapInstructor);
  }

  async getAircraft(id: string): Promise<Aircraft | null> {
    const { data } = await this.db.from("aircraft").select("*").eq("id", id).maybeSingle();
    return data ? mapAircraft(data) : null;
  }

  async getInstructor(id: string): Promise<Instructor | null> {
    const { data } = await this.db.from("instructors").select("*").eq("id", id).maybeSingle();
    return data ? mapInstructor(data) : null;
  }

  async getOrCreateAircraft(input: {
    tailNumber: string;
    type: string;
    homeAirport: string;
    organizationId?: string | null;
  }): Promise<Aircraft> {
    const tail = input.tailNumber.toUpperCase();
    const { data: existing } = await this.db
      .from("aircraft")
      .select("*")
      .ilike("tail_number", tail)
      .maybeSingle();
    if (existing) return mapAircraft(existing);

    const [make, ...modelParts] = (input.type || "Unknown").split(" ");
    const { data, error } = await this.db
      .from("aircraft")
      .insert({
        organization_id: input.organizationId ?? null,
        tail_number: tail,
        type: input.type || "Unknown",
        make: make || "Unknown",
        model: modelParts.join(" ") || "",
        home_airport: input.homeAirport || "",
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapAircraft(data);
  }

  async getOrCreateInstructor(name: string, organizationId?: string | null): Promise<Instructor> {
    const trimmed = name.trim();
    const { data: existing } = await this.db.from("instructors").select("*").ilike("name", trimmed).maybeSingle();
    if (existing) return mapInstructor(existing);

    const { data, error } = await this.db
      .from("instructors")
      .insert({ organization_id: organizationId ?? null, name: trimmed })
      .select("*")
      .single();
    if (error) throw error;
    return mapInstructor(data);
  }

  async listFlights(filter?: ListFlightsFilter): Promise<FlightWithRelations[]> {
    let query = this.db.from("flights").select("*").order("flight_date", { ascending: false });
    if (filter?.studentId) query = query.eq("student_id", filter.studentId);
    if (filter?.instructorId) query = query.eq("instructor_id", filter.instructorId);
    if (filter?.organizationId) query = query.eq("organization_id", filter.organizationId);
    const [{ data: flights, error }, aircraft, instructors] = await Promise.all([
      query,
      this.listAircraft(),
      this.listInstructors(),
    ]);
    if (error) throw error;
    return (flights ?? []).map((f) => joinFlight(mapFlight(f), aircraft, instructors));
  }

  async getFlight(id: string): Promise<FlightWithRelations | null> {
    const { data } = await this.db.from("flights").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const [aircraft, instructors] = await Promise.all([this.listAircraft(), this.listInstructors()]);
    return joinFlight(mapFlight(data), aircraft, instructors);
  }

  async createFlight(input: CreateFlightInput): Promise<FlightWithRelations> {
    const { data, error } = await this.db
      .from("flights")
      .insert({
        student_id: input.studentId,
        organization_id: input.organizationId ?? null,
        aircraft_id: input.aircraftId,
        departure_airport: input.departureAirport,
        arrival_airport: input.arrivalAirport,
        flight_date: input.flightDate,
        duration_minutes: input.durationMinutes,
        instructor_id: input.instructorId,
        reservation_id: input.reservationId ?? null,
        fr24_flight_id: input.fr24FlightId,
        external_provider: input.externalProvider ?? null,
        external_id: input.externalId ?? null,
        debrief_status: "not_started",
        track_geojson: input.track,
      })
      .select("*")
      .single();
    if (error) throw error;
    const [aircraft, instructors] = await Promise.all([this.listAircraft(), this.listInstructors()]);
    return joinFlight(mapFlight(data), aircraft, instructors);
  }

  async setFlightDebriefStatus(id: string, status: Flight["debriefStatus"]): Promise<void> {
    const { error } = await this.db.from("flights").update({ debrief_status: status }).eq("id", id);
    if (error) throw error;
  }

  async getDebriefByFlight(flightId: string): Promise<Debrief | null> {
    const { data } = await this.db
      .from("debriefs")
      .select("*")
      .eq("flight_id", flightId)
      .maybeSingle();
    return data ? mapDebrief(data) : null;
  }

  async createDebrief(input: CreateDebriefInput): Promise<Debrief> {
    const { data, error } = await this.db
      .from("debriefs")
      .insert({
        flight_id: input.flightId,
        transcript: input.transcript,
        audio_duration_seconds: input.audioDurationSeconds,
        structured_result: input.structuredResult,
        analyzed_with: input.analyzedWith,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapDebrief(data);
  }

  async listTrainingItems(): Promise<TrainingItem[]> {
    const { data, error } = await this.db.from("training_items").select("*");
    if (error) throw error;
    return (data ?? []).map(mapTrainingItem);
  }

  async createTrainingItems(
    items: Omit<TrainingItem, "id" | "createdAt">[],
  ): Promise<TrainingItem[]> {
    if (items.length === 0) return [];
    const { data, error } = await this.db
      .from("training_items")
      .insert(
        items.map((item) => ({
          flight_id: item.flightId,
          debrief_id: item.debriefId,
          category: item.category,
          description: item.description,
          done: item.done,
          completed_at: item.completedAt,
          visibility: item.visibility,
        })),
      )
      .select("*");
    if (error) throw error;
    return (data ?? []).map(mapTrainingItem);
  }

  async setTrainingItemDone(id: string, done: boolean): Promise<void> {
    const { error } = await this.db
      .from("training_items")
      .update({ done, completed_at: done ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
  }

  // --- Identity / organizations ---

  async getUser(id: string): Promise<User | null> {
    const { data } = await this.db.from("users").select("*").eq("id", id).maybeSingle();
    return data ? mapUser(data) : null;
  }

  async getUserByAuthId(authUserId: string): Promise<User | null> {
    const { data } = await this.db.from("users").select("*").eq("auth_user_id", authUserId).maybeSingle();
    return data ? mapUser(data) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data } = await this.db.from("users").select("*").ilike("email", email).maybeSingle();
    return data ? mapUser(data) : null;
  }

  async listUsers(): Promise<User[]> {
    const { data, error } = await this.db.from("users").select("*");
    if (error) throw error;
    return (data ?? []).map(mapUser);
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const { data } = await this.db.from("organizations").select("*").eq("id", id).maybeSingle();
    return data ? mapOrganization(data) : null;
  }

  async listOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.db.from("organizations").select("*");
    if (error) throw error;
    return (data ?? []).map(mapOrganization);
  }

  async listOrganizationsForUser(userId: string): Promise<Organization[]> {
    const { data, error } = await this.db
      .from("organization_members")
      .select("organization:organizations(*)")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((row: { organization: unknown }) => mapOrganization(row.organization as Record<string, unknown>));
  }

  async listMembers(organizationId: string, role?: OrgRole): Promise<OrganizationMember[]> {
    let query = this.db.from("organization_members").select("*").eq("organization_id", organizationId);
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapMember);
  }

  async listMembershipsForUser(userId: string): Promise<OrganizationMember[]> {
    const { data, error } = await this.db.from("organization_members").select("*").eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map(mapMember);
  }

  async createUser(input: { name: string; email: string; authUserId?: string | null }): Promise<User> {
    const { data, error } = await this.db
      .from("users")
      .insert({ name: input.name, email: input.email, auth_user_id: input.authUserId ?? null })
      .select("*")
      .single();
    if (error) throw error;
    return mapUser(data);
  }

  async setUserAuthId(userId: string, authUserId: string): Promise<void> {
    const { error } = await this.db.from("users").update({ auth_user_id: authUserId }).eq("id", userId);
    if (error) throw error;
  }

  async addMember(input: { organizationId: string; userId: string; role: OrgRole }): Promise<OrganizationMember> {
    const { data, error } = await this.db
      .from("organization_members")
      .insert({
        organization_id: input.organizationId,
        user_id: input.userId,
        role: input.role,
        status: "active",
        certificate_type: input.role === "student" ? "PRIVATE" : null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapMember(data);
  }

  async setMemberStatus(memberId: string, status: OrganizationMember["status"]): Promise<void> {
    const { error } = await this.db.from("organization_members").update({ status }).eq("id", memberId);
    if (error) throw error;
  }

  async setMemberCertificateType(
    memberId: string,
    certificateType: OrganizationMember["certificateType"],
  ): Promise<void> {
    const { error } = await this.db
      .from("organization_members")
      .update({ certificate_type: certificateType })
      .eq("id", memberId);
    if (error) throw error;
  }

  // --- Student <-> instructor roster ---

  async listInstructorLinksForStudent(studentId: string): Promise<StudentInstructor[]> {
    const { data, error } = await this.db.from("student_instructors").select("*").eq("student_id", studentId);
    if (error) throw error;
    return (data ?? []).map(mapStudentInstructor);
  }

  async listStudentLinksForInstructor(instructorId: string, organizationId?: string): Promise<StudentInstructor[]> {
    let query = this.db.from("student_instructors").select("*").eq("instructor_id", instructorId);
    if (organizationId) query = query.eq("organization_id", organizationId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapStudentInstructor);
  }

  async linkStudentInstructor(input: {
    studentId: string;
    instructorId: string;
    organizationId: string;
    isPrimary: boolean;
  }): Promise<StudentInstructor> {
    const { data, error } = await this.db
      .from("student_instructors")
      .insert({
        student_id: input.studentId,
        instructor_id: input.instructorId,
        organization_id: input.organizationId,
        is_primary: input.isPrimary,
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapStudentInstructor(data);
  }

  async setStudentInstructorStatus(linkId: string, status: StudentInstructor["status"]): Promise<void> {
    const { error } = await this.db.from("student_instructors").update({ status }).eq("id", linkId);
    if (error) throw error;
  }

  // --- Reservations ---

  async listReservations(filter?: ListReservationsFilter): Promise<Reservation[]> {
    let query = this.db.from("reservations").select("*").order("scheduled_start", { ascending: true });
    if (filter?.organizationId) query = query.eq("organization_id", filter.organizationId);
    if (filter?.studentId) query = query.eq("student_id", filter.studentId);
    if (filter?.instructorId) query = query.eq("instructor_id", filter.instructorId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapReservation);
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const { data } = await this.db.from("reservations").select("*").eq("id", id).maybeSingle();
    return data ? mapReservation(data) : null;
  }

  // --- Structured training signals ---

  async createTrainingSignals(items: Omit<TrainingSignal, "id" | "createdAt">[]): Promise<TrainingSignal[]> {
    if (items.length === 0) return [];
    const { data, error } = await this.db
      .from("training_signals")
      .insert(
        items.map((item) => ({
          organization_id: item.organizationId,
          student_id: item.studentId,
          instructor_id: item.instructorId,
          aircraft_id: item.aircraftId,
          flight_id: item.flightId,
          debrief_id: item.debriefId,
          flight_date: item.flightDate,
          category: item.category,
          skill: item.skill,
          status: item.status,
          source: item.source,
          statement: item.statement,
        })),
      )
      .select("*");
    if (error) throw error;
    return (data ?? []).map(mapTrainingSignal);
  }

  async listTrainingSignals(filter?: ListTrainingSignalsFilter): Promise<TrainingSignal[]> {
    let query = this.db.from("training_signals").select("*").order("flight_date", { ascending: false });
    if (filter?.organizationId) query = query.eq("organization_id", filter.organizationId);
    if (filter?.studentId) query = query.eq("student_id", filter.studentId);
    if (filter?.instructorId) query = query.eq("instructor_id", filter.instructorId);
    if (filter?.aircraftId) query = query.eq("aircraft_id", filter.aircraftId);
    if (filter?.skill) query = query.eq("skill", filter.skill);
    if (filter?.category) query = query.eq("category", filter.category);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapTrainingSignal);
  }
}

function mapAircraft(row: Record<string, unknown>): Aircraft {
  return {
    id: row.id as string,
    tailNumber: row.tail_number as string,
    type: row.type as string,
    make: (row.make as string) ?? "",
    model: (row.model as string) ?? "",
    homeAirport: row.home_airport as string,
    organizationId: (row.organization_id as string) ?? null,
    status: (row.status as Aircraft["status"]) ?? "active",
    externalProvider: (row.external_provider as string) ?? null,
    externalId: (row.external_id as string) ?? null,
  };
}

function mapInstructor(row: Record<string, unknown>): Instructor {
  return { id: row.id as string, name: row.name as string };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    authUserId: (row.auth_user_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as Organization["kind"],
    createdAt: row.created_at as string,
  };
}

function mapMember(row: Record<string, unknown>): OrganizationMember {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    userId: row.user_id as string,
    role: row.role as OrgRole,
    status: row.status as OrganizationMember["status"],
    certificateType: (row.certificate_type as OrganizationMember["certificateType"]) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapStudentInstructor(row: Record<string, unknown>): StudentInstructor {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    instructorId: row.instructor_id as string,
    organizationId: row.organization_id as string,
    isPrimary: row.is_primary as boolean,
    status: row.status as StudentInstructor["status"],
    createdAt: row.created_at as string,
  };
}

function mapReservation(row: Record<string, unknown>): Reservation {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    studentId: row.student_id as string,
    instructorId: row.instructor_id as string,
    aircraftId: row.aircraft_id as string,
    scheduledStart: row.scheduled_start as string,
    scheduledEnd: row.scheduled_end as string,
    status: row.status as Reservation["status"],
    externalProvider: (row.external_provider as string) ?? null,
    externalId: (row.external_id as string) ?? null,
  };
}

function mapFlight(row: Record<string, unknown>): Flight {
  return {
    id: row.id as string,
    userId: row.student_id as string,
    organizationId: (row.organization_id as string) ?? null,
    aircraftId: row.aircraft_id as string,
    departureAirport: row.departure_airport as string,
    arrivalAirport: row.arrival_airport as string,
    flightDate: row.flight_date as string,
    durationMinutes: row.duration_minutes as number,
    instructorId: (row.instructor_id as string) ?? null,
    reservationId: (row.reservation_id as string) ?? null,
    fr24FlightId: (row.fr24_flight_id as string) ?? null,
    externalProvider: (row.external_provider as string) ?? null,
    externalId: (row.external_id as string) ?? null,
    debriefStatus: row.debrief_status as Flight["debriefStatus"],
    track: (row.track_geojson as Flight["track"]) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapDebrief(row: Record<string, unknown>): Debrief {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    transcript: row.transcript as string,
    audioDurationSeconds: row.audio_duration_seconds as number,
    structuredResult: row.structured_result as Debrief["structuredResult"],
    analyzedWith: row.analyzed_with as Debrief["analyzedWith"],
    createdAt: row.created_at as string,
  };
}

function mapTrainingItem(row: Record<string, unknown>): TrainingItem {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    debriefId: row.debrief_id as string,
    category: row.category as TrainingItem["category"],
    description: row.description as string,
    done: row.done as boolean,
    completedAt: (row.completed_at as string | null) ?? null,
    visibility: (row.visibility as TrainingItem["visibility"]) ?? "shared",
    createdAt: row.created_at as string,
  };
}

function mapTrainingSignal(row: Record<string, unknown>): TrainingSignal {
  return {
    id: row.id as string,
    organizationId: (row.organization_id as string) ?? null,
    studentId: row.student_id as string,
    instructorId: (row.instructor_id as string) ?? null,
    aircraftId: (row.aircraft_id as string) ?? null,
    flightId: row.flight_id as string,
    debriefId: row.debrief_id as string,
    flightDate: row.flight_date as string,
    category: row.category as TrainingSignal["category"],
    skill: row.skill as TrainingSignal["skill"],
    status: row.status as TrainingSignal["status"],
    source: row.source as TrainingSignal["source"],
    statement: row.statement as string,
    createdAt: row.created_at as string,
  };
}

function joinFlight(flight: Flight, aircraft: Aircraft[], instructors: Instructor[]): FlightWithRelations {
  return {
    ...flight,
    aircraft: aircraft.find((a) => a.id === flight.aircraftId)!,
    instructor: instructors.find((i) => i.id === flight.instructorId) ?? null,
  };
}
