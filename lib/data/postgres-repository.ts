import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
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

/**
 * Repository backed by Replit Postgres (DATABASE_URL) -- the persistent
 * source of truth for flights, debriefs, reservations, and training data.
 * The identity tables (users/organizations/organization_members) are shared
 * with lib/auth/store.ts; the schema lives in db/schema.sql.
 *
 * On first use it seeds the demo dataset (lib/data/seed.ts) into any empty
 * domain tables so a fresh database starts with the same data the in-memory
 * mock used to fabricate. Seeding is idempotent (ON CONFLICT DO NOTHING with
 * stable seeded ids) and never overwrites user-created rows.
 */
export class PostgresRepository implements Repository {
  private seeded: Promise<void> | null = null;

  constructor(private readonly pool: Pool) {}

  private async db(): Promise<Pool> {
    if (!this.seeded) this.seeded = this.seedIfEmpty();
    await this.seeded;
    return this.pool;
  }

  private async seedIfEmpty(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Serialize concurrent server instances racing to seed.
      await client.query("SELECT pg_advisory_xact_lock(727275001)");
      const { rows } = await client.query("SELECT count(*)::int AS n FROM flights");
      if (rows[0].n === 0) {
        await seedDomainTables(client);
        console.log("[Data] PostgresRepository seeded demo flight/training data");
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      this.seeded = null; // allow retry on next call
      throw err;
    } finally {
      client.release();
    }
  }

  // --- Aircraft / instructors ---

  async listAircraft(organizationId?: string): Promise<Aircraft[]> {
    const db = await this.db();
    const { rows } = organizationId
      ? await db.query("SELECT * FROM aircraft WHERE organization_id = $1 ORDER BY tail_number", [organizationId])
      : await db.query("SELECT * FROM aircraft ORDER BY tail_number");
    return rows.map(mapAircraft);
  }

  async listInstructors(): Promise<Instructor[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM instructors ORDER BY name");
    return rows.map(mapInstructor);
  }

  async getAircraft(id: string): Promise<Aircraft | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM aircraft WHERE id = $1", [id]);
    return rows[0] ? mapAircraft(rows[0]) : null;
  }

  async getInstructor(id: string): Promise<Instructor | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM instructors WHERE id = $1", [id]);
    return rows[0] ? mapInstructor(rows[0]) : null;
  }

  async getOrCreateAircraft(input: {
    tailNumber: string;
    type: string;
    homeAirport: string;
    organizationId?: string | null;
  }): Promise<Aircraft> {
    const db = await this.db();
    const tail = input.tailNumber.toUpperCase();
    const { rows: existing } = await db.query("SELECT * FROM aircraft WHERE upper(tail_number) = $1", [tail]);
    if (existing[0]) return mapAircraft(existing[0]);
    const [make, ...modelParts] = (input.type || "Unknown").split(" ");
    const { rows } = await db.query(
      `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [
        randomUUID(),
        tail,
        input.type || "Unknown",
        make || "Unknown",
        modelParts.join(" ") || "",
        input.homeAirport || "",
        input.organizationId ?? null,
      ],
    );
    return mapAircraft(rows[0]);
  }

  async getOrCreateInstructor(name: string, organizationId?: string | null): Promise<Instructor> {
    const db = await this.db();
    const trimmed = name.trim();
    const { rows: existing } = await db.query("SELECT * FROM instructors WHERE lower(name) = lower($1)", [trimmed]);
    if (existing[0]) return mapInstructor(existing[0]);
    const { rows } = await db.query(
      "INSERT INTO instructors (id, name, organization_id) VALUES ($1, $2, $3) RETURNING *",
      [randomUUID(), trimmed, organizationId ?? null],
    );
    return mapInstructor(rows[0]);
  }

  // --- Flights ---

  async listFlights(filter?: ListFlightsFilter): Promise<FlightWithRelations[]> {
    const db = await this.db();
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter?.studentId) {
      params.push(filter.studentId);
      where.push(`f.student_id = $${params.length}`);
    }
    if (filter?.instructorId) {
      params.push(filter.instructorId);
      where.push(`f.instructor_id = $${params.length}`);
    }
    if (filter?.organizationId) {
      params.push(filter.organizationId);
      where.push(`f.organization_id = $${params.length}`);
    }
    const { rows } = await db.query(
      `SELECT f.*, row_to_json(a.*) AS aircraft_row, row_to_json(i.*) AS instructor_row
       FROM flights f
       JOIN aircraft a ON a.id = f.aircraft_id
       LEFT JOIN instructors i ON i.id = f.instructor_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY f.flight_date DESC, f.created_at DESC`,
      params,
    );
    return rows.map(mapFlightWithRelations);
  }

  async getFlight(id: string): Promise<FlightWithRelations | null> {
    const db = await this.db();
    const { rows } = await db.query(
      `SELECT f.*, row_to_json(a.*) AS aircraft_row, row_to_json(i.*) AS instructor_row
       FROM flights f
       JOIN aircraft a ON a.id = f.aircraft_id
       LEFT JOIN instructors i ON i.id = f.instructor_id
       WHERE f.id = $1`,
      [id],
    );
    return rows[0] ? mapFlightWithRelations(rows[0]) : null;
  }

  async createFlight(input: CreateFlightInput): Promise<FlightWithRelations> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, reservation_id, fr24_flight_id,
         external_provider, external_id, debrief_status, track
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'not_started',$14)
       RETURNING id`,
      [
        randomUUID(),
        input.studentId ?? DEMO_USER_ID,
        input.organizationId ?? null,
        input.aircraftId,
        input.departureAirport,
        input.arrivalAirport,
        input.flightDate,
        input.durationMinutes,
        input.instructorId,
        input.reservationId ?? null,
        input.fr24FlightId,
        input.externalProvider ?? null,
        input.externalId ?? null,
        input.track ? JSON.stringify(input.track) : null,
      ],
    );
    const created = await this.getFlight(rows[0].id);
    if (!created) throw new Error("createFlight: inserted flight not found");
    return created;
  }

  async setFlightDebriefStatus(id: string, status: Flight["debriefStatus"]): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE flights SET debrief_status = $2 WHERE id = $1", [id, status]);
  }

  // --- Debriefs ---

  async getDebriefByFlight(flightId: string): Promise<Debrief | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM debriefs WHERE flight_id = $1", [flightId]);
    return rows[0] ? mapDebrief(rows[0]) : null;
  }

  async createDebrief(input: CreateDebriefInput): Promise<Debrief> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO debriefs (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        randomUUID(),
        input.flightId,
        input.transcript,
        input.audioDurationSeconds,
        JSON.stringify(input.structuredResult),
        input.analyzedWith,
      ],
    );
    return mapDebrief(rows[0]);
  }

  // --- Training items ---

  async listTrainingItems(): Promise<TrainingItem[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM training_items ORDER BY created_at");
    return rows.map(mapTrainingItem);
  }

  async createTrainingItems(items: Omit<TrainingItem, "id" | "createdAt">[]): Promise<TrainingItem[]> {
    if (items.length === 0) return [];
    const db = await this.db();
    const created: TrainingItem[] = [];
    for (const item of items) {
      const { rows } = await db.query(
        `INSERT INTO training_items (id, flight_id, debrief_id, category, description, done, completed_at, visibility)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [randomUUID(), item.flightId, item.debriefId, item.category, item.description, item.done, item.completedAt, item.visibility],
      );
      created.push(mapTrainingItem(rows[0]));
    }
    return created;
  }

  async setTrainingItemDone(id: string, done: boolean): Promise<void> {
    const db = await this.db();
    await db.query(
      "UPDATE training_items SET done = $2, completed_at = CASE WHEN $2 THEN now() ELSE NULL END WHERE id = $1",
      [id, done],
    );
  }

  // --- Identity / organizations ---

  async getUser(id: string): Promise<User | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async getUserByAuthId(authUserId: string): Promise<User | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM users WHERE auth_user_id = $1", [authUserId]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async listUsers(): Promise<User[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM users ORDER BY name");
    return rows.map(mapUser);
  }

  async createUser(input: { name: string; email: string; authUserId?: string | null }): Promise<User> {
    const db = await this.db();
    const { rows } = await db.query(
      "INSERT INTO users (id, name, email, auth_user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [`user-${randomUUID()}`, input.name, input.email, input.authUserId ?? null],
    );
    return mapUser(rows[0]);
  }

  async setUserAuthId(userId: string, authUserId: string): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE users SET auth_user_id = $2 WHERE id = $1", [userId, authUserId]);
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM organizations WHERE id = $1", [id]);
    return rows[0] ? mapOrganization(rows[0]) : null;
  }

  async listOrganizations(): Promise<Organization[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM organizations ORDER BY name");
    return rows.map(mapOrganization);
  }

  async listOrganizationsForUser(userId: string): Promise<Organization[]> {
    const db = await this.db();
    const { rows } = await db.query(
      `SELECT o.* FROM organizations o
       JOIN organization_members m ON m.organization_id = o.id
       WHERE m.user_id = $1
       GROUP BY o.id
       ORDER BY o.name`,
      [userId],
    );
    return rows.map(mapOrganization);
  }

  async listMembers(organizationId: string, role?: OrgRole): Promise<OrganizationMember[]> {
    const db = await this.db();
    const { rows } = role
      ? await db.query("SELECT * FROM organization_members WHERE organization_id = $1 AND role = $2 ORDER BY created_at", [organizationId, role])
      : await db.query("SELECT * FROM organization_members WHERE organization_id = $1 ORDER BY created_at", [organizationId]);
    return rows.map(mapMember);
  }

  async listMembershipsForUser(userId: string): Promise<OrganizationMember[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM organization_members WHERE user_id = $1 ORDER BY created_at", [userId]);
    return rows.map(mapMember);
  }

  async addMember(input: { organizationId: string; userId: string; role: OrgRole }): Promise<OrganizationMember> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, status, certificate_type)
       VALUES ($1, $2, $3, $4, 'active', $5)
       ON CONFLICT (organization_id, user_id, role) DO UPDATE SET status = 'active'
       RETURNING *`,
      [`member-${randomUUID()}`, input.organizationId, input.userId, input.role, input.role === "student" ? "PRIVATE" : null],
    );
    return mapMember(rows[0]);
  }

  async setMemberStatus(memberId: string, status: OrganizationMember["status"]): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE organization_members SET status = $2 WHERE id = $1", [memberId, status]);
  }

  async setMemberCertificateType(memberId: string, certificateType: OrganizationMember["certificateType"]): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE organization_members SET certificate_type = $2 WHERE id = $1", [memberId, certificateType]);
  }

  // --- Student <-> instructor roster ---

  async listInstructorLinksForStudent(studentId: string): Promise<StudentInstructor[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM student_instructors WHERE student_id = $1 ORDER BY created_at", [studentId]);
    return rows.map(mapStudentInstructor);
  }

  async listStudentLinksForInstructor(instructorId: string, organizationId?: string): Promise<StudentInstructor[]> {
    const db = await this.db();
    const { rows } = organizationId
      ? await db.query("SELECT * FROM student_instructors WHERE instructor_id = $1 AND organization_id = $2 ORDER BY created_at", [instructorId, organizationId])
      : await db.query("SELECT * FROM student_instructors WHERE instructor_id = $1 ORDER BY created_at", [instructorId]);
    return rows.map(mapStudentInstructor);
  }

  async linkStudentInstructor(input: {
    studentId: string;
    instructorId: string;
    organizationId: string;
    isPrimary: boolean;
  }): Promise<StudentInstructor> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (student_id, instructor_id, organization_id)
       DO UPDATE SET status = 'active', is_primary = EXCLUDED.is_primary
       RETURNING *`,
      [`link-${randomUUID()}`, input.studentId, input.instructorId, input.organizationId, input.isPrimary],
    );
    return mapStudentInstructor(rows[0]);
  }

  async setStudentInstructorStatus(linkId: string, status: StudentInstructor["status"]): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE student_instructors SET status = $2 WHERE id = $1", [linkId, status]);
  }

  // --- Reservations ---

  async listReservations(filter?: ListReservationsFilter): Promise<Reservation[]> {
    const db = await this.db();
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter?.organizationId) {
      params.push(filter.organizationId);
      where.push(`organization_id = $${params.length}`);
    }
    if (filter?.studentId) {
      params.push(filter.studentId);
      where.push(`student_id = $${params.length}`);
    }
    if (filter?.instructorId) {
      params.push(filter.instructorId);
      where.push(`instructor_id = $${params.length}`);
    }
    const { rows } = await db.query(
      `SELECT * FROM reservations ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY scheduled_start`,
      params,
    );
    return rows.map(mapReservation);
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM reservations WHERE id = $1", [id]);
    return rows[0] ? mapReservation(rows[0]) : null;
  }

  // --- Structured training signals ---

  async createTrainingSignals(items: Omit<TrainingSignal, "id" | "createdAt">[]): Promise<TrainingSignal[]> {
    if (items.length === 0) return [];
    const db = await this.db();
    const created: TrainingSignal[] = [];
    for (const item of items) {
      const { rows } = await db.query(
        `INSERT INTO training_signals (
           id, organization_id, student_id, instructor_id, aircraft_id, flight_id, debrief_id,
           flight_date, category, skill, status, source, statement
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          randomUUID(),
          item.organizationId,
          item.studentId,
          item.instructorId,
          item.aircraftId,
          item.flightId,
          item.debriefId,
          item.flightDate,
          item.category,
          item.skill,
          item.status,
          item.source,
          item.statement,
        ],
      );
      created.push(mapTrainingSignal(rows[0]));
    }
    return created;
  }

  async listTrainingSignals(filter?: ListTrainingSignalsFilter): Promise<TrainingSignal[]> {
    const db = await this.db();
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      params.push(value);
      where.push(`${column} = $${params.length}`);
    };
    if (filter?.organizationId) add("organization_id", filter.organizationId);
    if (filter?.studentId) add("student_id", filter.studentId);
    if (filter?.instructorId) add("instructor_id", filter.instructorId);
    if (filter?.aircraftId) add("aircraft_id", filter.aircraftId);
    if (filter?.skill) add("skill", filter.skill);
    if (filter?.category) add("category", filter.category);
    const { rows } = await db.query(
      `SELECT * FROM training_signals ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY flight_date DESC, created_at DESC`,
      params,
    );
    return rows.map(mapTrainingSignal);
  }
}

// --- Seeding ----------------------------------------------------------------

async function seedDomainTables(client: PoolClient): Promise<void> {
  const seed = buildSeed();
  for (const i of seed.instructors) {
    await client.query(
      "INSERT INTO instructors (id, name, organization_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [i.id, i.name, "org-falcon"],
    );
  }
  for (const a of seed.aircraft) {
    await client.query(
      `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id, status, external_provider, external_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [a.id, a.tailNumber, a.type, a.make, a.model, a.homeAirport, a.organizationId, a.status, a.externalProvider, a.externalId],
    );
  }
  for (const l of seed.studentInstructors) {
    await client.query(
      `INSERT INTO student_instructors (id, student_id, instructor_id, organization_id, is_primary, status)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [l.id, l.studentId, l.instructorId, l.organizationId, l.isPrimary, l.status],
    );
  }
  for (const r of seed.reservations) {
    await client.query(
      `INSERT INTO reservations (id, organization_id, student_id, instructor_id, aircraft_id, scheduled_start, scheduled_end, status, external_provider, external_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.organizationId, r.studentId, r.instructorId, r.aircraftId, r.scheduledStart, r.scheduledEnd, r.status, r.externalProvider, r.externalId],
    );
  }
  for (const f of seed.flights) {
    await client.query(
      `INSERT INTO flights (
         id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, instructor_id, reservation_id, fr24_flight_id,
         external_provider, external_id, debrief_status, track, created_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO NOTHING`,
      [
        f.id, f.userId, f.organizationId, f.aircraftId, f.departureAirport, f.arrivalAirport,
        f.flightDate, f.durationMinutes, f.instructorId, f.reservationId, f.fr24FlightId,
        f.externalProvider, f.externalId, f.debriefStatus,
        f.track ? JSON.stringify(f.track) : null, f.createdAt,
      ],
    );
  }
  for (const d of seed.debriefs) {
    await client.query(
      `INSERT INTO debriefs (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [d.id, d.flightId, d.transcript, d.audioDurationSeconds, JSON.stringify(d.structuredResult), d.analyzedWith, d.createdAt],
    );
  }
  for (const t of seed.trainingItems) {
    await client.query(
      `INSERT INTO training_items (id, flight_id, debrief_id, category, description, done, completed_at, visibility, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [t.id, t.flightId, t.debriefId, t.category, t.description, t.done, t.completedAt, t.visibility, t.createdAt],
    );
  }
  for (const s of seed.trainingSignals) {
    await client.query(
      `INSERT INTO training_signals (
         id, organization_id, student_id, instructor_id, aircraft_id, flight_id, debrief_id,
         flight_date, category, skill, status, source, statement, created_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
      [
        s.id, s.organizationId, s.studentId, s.instructorId, s.aircraftId, s.flightId, s.debriefId,
        s.flightDate, s.category, s.skill, s.status, s.source, s.statement, s.createdAt,
      ],
    );
  }
}

// --- Row mappers --------------------------------------------------------------

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapAircraft(row: Row): Aircraft {
  return {
    id: row.id as string,
    tailNumber: row.tail_number as string,
    type: row.type as string,
    make: (row.make as string) ?? "",
    model: (row.model as string) ?? "",
    homeAirport: (row.home_airport as string) ?? "",
    organizationId: (row.organization_id as string | null) ?? null,
    status: (row.status as Aircraft["status"]) ?? "active",
    externalProvider: (row.external_provider as string | null) ?? null,
    externalId: (row.external_id as string | null) ?? null,
  };
}

function mapInstructor(row: Row): Instructor {
  return { id: row.id as string, name: row.name as string };
}

function mapUser(row: Row): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    authUserId: (row.auth_user_id as string | null) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapOrganization(row: Row): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as Organization["kind"],
    createdAt: iso(row.created_at),
  };
}

function mapMember(row: Row): OrganizationMember {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    userId: row.user_id as string,
    role: row.role as OrgRole,
    status: row.status as OrganizationMember["status"],
    certificateType: (row.certificate_type as OrganizationMember["certificateType"]) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapStudentInstructor(row: Row): StudentInstructor {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    instructorId: row.instructor_id as string,
    organizationId: row.organization_id as string,
    isPrimary: row.is_primary as boolean,
    status: row.status as StudentInstructor["status"],
    createdAt: iso(row.created_at),
  };
}

function mapReservation(row: Row): Reservation {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    studentId: row.student_id as string,
    instructorId: row.instructor_id as string,
    aircraftId: row.aircraft_id as string,
    scheduledStart: iso(row.scheduled_start),
    scheduledEnd: iso(row.scheduled_end),
    status: row.status as Reservation["status"],
    externalProvider: (row.external_provider as string | null) ?? null,
    externalId: (row.external_id as string | null) ?? null,
  };
}

function mapFlight(row: Row): Flight {
  return {
    id: row.id as string,
    userId: row.student_id as string,
    organizationId: (row.organization_id as string | null) ?? null,
    aircraftId: row.aircraft_id as string,
    departureAirport: row.departure_airport as string,
    arrivalAirport: row.arrival_airport as string,
    flightDate: row.flight_date as string,
    durationMinutes: row.duration_minutes as number,
    instructorId: (row.instructor_id as string | null) ?? null,
    reservationId: (row.reservation_id as string | null) ?? null,
    fr24FlightId: (row.fr24_flight_id as string | null) ?? null,
    externalProvider: (row.external_provider as string | null) ?? null,
    externalId: (row.external_id as string | null) ?? null,
    debriefStatus: row.debrief_status as Flight["debriefStatus"],
    track: (row.track as Flight["track"]) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapFlightWithRelations(row: Row): FlightWithRelations {
  const aircraftRow = row.aircraft_row as Row | null;
  const instructorRow = row.instructor_row as Row | null;
  if (!aircraftRow) throw new Error(`Flight ${row.id} references missing aircraft ${row.aircraft_id}`);
  return {
    ...mapFlight(row),
    aircraft: mapAircraft(aircraftRow),
    instructor: instructorRow ? mapInstructor(instructorRow) : null,
  };
}

function mapDebrief(row: Row): Debrief {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    transcript: row.transcript as string,
    audioDurationSeconds: row.audio_duration_seconds as number,
    structuredResult: row.structured_result as Debrief["structuredResult"],
    analyzedWith: row.analyzed_with as Debrief["analyzedWith"],
    createdAt: iso(row.created_at),
  };
}

function mapTrainingItem(row: Row): TrainingItem {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    debriefId: row.debrief_id as string,
    category: row.category as TrainingItem["category"],
    description: row.description as string,
    done: row.done as boolean,
    completedAt: row.completed_at ? iso(row.completed_at) : null,
    visibility: (row.visibility as TrainingItem["visibility"]) ?? "shared",
    createdAt: iso(row.created_at),
  };
}

function mapTrainingSignal(row: Row): TrainingSignal {
  return {
    id: row.id as string,
    organizationId: (row.organization_id as string | null) ?? null,
    studentId: row.student_id as string,
    instructorId: (row.instructor_id as string | null) ?? null,
    aircraftId: (row.aircraft_id as string | null) ?? null,
    flightId: row.flight_id as string,
    debriefId: row.debrief_id as string,
    flightDate: row.flight_date as string,
    category: row.category as TrainingSignal["category"],
    skill: row.skill as TrainingSignal["skill"],
    status: row.status as TrainingSignal["status"],
    source: row.source as TrainingSignal["source"],
    statement: row.statement as string,
    createdAt: iso(row.created_at),
  };
}
