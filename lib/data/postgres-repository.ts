import type { ArticleBody } from "@/lib/content/article-body";
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type {
  Aircraft,
  Airport,
  AirportInsightsRecord,
  Article,
  ArticleIdea,
  ArticleIdeaStatus,
  ArticleStatus,
  AssessmentRole,
  CardDefinition,
  ConsentRecord,
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
  TrainingItem,
  TrainingSignal,
  TranscriptSegment,
  User,
} from "@/lib/types";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import { buildSeed, DEMO_USER_ID } from "./seed";
import type {
  CreateArticleIdeaInput,
  CreateArticleInput,
  CreateDebriefInput,
  CreateFlightInput,
  CreateReferralEventInput,
  CreateReservationInput,
  UpdateAircraftInput,
  AircraftDeleteResult,
  UpdateReservationInput,
  CreateResearchReportInput,
  CreateStudentNoteInput,
  ListFlightsFilter,
  ListReservationsFilter,
  ListTrainingItemsFilter,
  ListTrainingSignalsFilter,
  Repository,
  UpdateArticleInput,
  UpdateResearchReportInput,
} from "./types";

/**
 * Repository backed by Replit Postgres (DATABASE_URL) -- the persistent
 * source of truth for flights, debriefs, reservations, and training data.
 * The identity tables (users/organizations/organization_members) are shared
 * with lib/auth/store.ts; the schema lives in db/schema.sql.
 *
 * When SEED_DEMO_DATA is set (and never in a production deployment), it seeds
 * the demo dataset (lib/data/seed.ts) into any empty domain tables on first
 * use. Seeding is idempotent (ON CONFLICT DO NOTHING with stable seeded ids)
 * and never overwrites user-created rows. Without the flag a fresh database
 * starts empty except for real identity data.
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
    if (!shouldSeedDemoData()) return;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Serialize concurrent server instances racing to seed.
      await client.query("SELECT pg_advisory_xact_lock(727275001)");
      const { rows } = await client.query("SELECT count(*)::int AS n FROM flights");
      // FORCE_RESEED re-runs the seed against a non-empty database to pick up
      // *new* seed.ts additions (e.g. a newly added demo student) -- safe because
      // every insert in seedDomainTables is ON CONFLICT (id) DO NOTHING, so
      // already-seeded and real user-created rows are untouched either way.
      if (rows[0].n === 0 || process.env.FORCE_RESEED) {
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
       ON CONFLICT ((upper(tail_number))) DO NOTHING
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
    if (rows[0]) return mapAircraft(rows[0]);
    // Lost the race to a concurrent insert with the same tail number -- the
    // conflicting row now exists, fetch it instead of returning undefined.
    const { rows: afterConflict } = await db.query("SELECT * FROM aircraft WHERE upper(tail_number) = $1", [tail]);
    return mapAircraft(afterConflict[0]);
  }

  async updateAircraft(id: string, input: UpdateAircraftInput): Promise<Aircraft | null> {
    // Dynamic set list, same reason as updateReservation: an omitted field
    // keeps its current value instead of being nulled by a fixed column list.
    const sets: string[] = [];
    const values: unknown[] = [];
    const push = (column: string, value: unknown) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };
    if (input.tailNumber !== undefined) push("tail_number", input.tailNumber.trim().toUpperCase());
    if (input.homeAirport !== undefined) push("home_airport", input.homeAirport.trim());
    if (input.status !== undefined) push("status", input.status);

    // `type` is the denormalized display string ("Diamond DA40 NG") that the
    // rest of the app reads, so it has to move whenever make/model does --
    // otherwise the list keeps rendering the old name after an edit.
    if (input.make !== undefined || input.model !== undefined) {
      const current = await this.getAircraft(id);
      if (!current) return null;
      const make = (input.make ?? current.make).trim();
      const model = (input.model ?? current.model).trim();
      push("make", make);
      push("model", model);
      push("type", `${make} ${model}`.trim() || "Unknown");
    }
    if (sets.length === 0) return this.getAircraft(id);

    values.push(id);
    const db = await this.db();
    const { rows } = await db.query(
      `UPDATE aircraft SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return rows[0] ? mapAircraft(rows[0]) : null;
  }

  async deleteAircraft(id: string): Promise<AircraftDeleteResult> {
    const db = await this.db();
    // Checked rather than caught: flights.aircraft_id is ON DELETE RESTRICT, so
    // the delete would throw a foreign-key error we'd have to parse. Counting
    // first lets the caller say how many flights are in the way.
    const { rows: flightRows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM flights WHERE aircraft_id = $1",
      [id],
    );
    const flightCount = flightRows[0]?.n ?? 0;
    if (flightCount > 0) return { deleted: false, reason: "has-flights", flightCount };

    // reservations.aircraft_id is ON DELETE CASCADE -- report what the delete
    // takes with it so it isn't silent.
    const { rows: resRows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM reservations WHERE aircraft_id = $1",
      [id],
    );
    await db.query("DELETE FROM aircraft WHERE id = $1", [id]);
    return { deleted: true, cancelledReservations: resRows[0]?.n ?? 0 };
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

  async deleteFlight(id: string): Promise<void> {
    const db = await this.db();
    await db.query("DELETE FROM flights WHERE id = $1", [id]);
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
      `INSERT INTO debriefs (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with, guidance_mode, recording_started_at, recording_ended_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        randomUUID(),
        input.flightId,
        input.transcript,
        input.audioDurationSeconds,
        JSON.stringify(input.structuredResult),
        input.analyzedWith,
        input.guidanceMode ?? "freeform",
        input.recordingStartedAt ?? null,
        input.recordingEndedAt ?? null,
      ],
    );
    return mapDebrief(rows[0]);
  }

  async updateDebriefCue(debriefId: string, cue: string): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE debriefs SET structured_result = jsonb_set(structured_result, '{nextFlightCue}', $2::jsonb) WHERE id = $1", [
      debriefId,
      JSON.stringify(cue),
    ]);
  }

  async savePendingDebriefTranscript(
    input: Omit<PendingDebriefTranscript, "createdAt">,
  ): Promise<PendingDebriefTranscript> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO pending_debrief_transcripts
         (flight_id, transcript, audio_duration_seconds, guidance_mode, recording_started_at, recording_ended_at, words, card_boundaries)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (flight_id) DO UPDATE SET
         transcript = EXCLUDED.transcript,
         audio_duration_seconds = EXCLUDED.audio_duration_seconds,
         guidance_mode = EXCLUDED.guidance_mode,
         recording_started_at = EXCLUDED.recording_started_at,
         recording_ended_at = EXCLUDED.recording_ended_at,
         words = EXCLUDED.words,
         card_boundaries = EXCLUDED.card_boundaries,
         created_at = now()
       RETURNING *`,
      [
        input.flightId,
        input.transcript,
        input.audioDurationSeconds,
        input.guidanceMode,
        input.recordingStartedAt,
        input.recordingEndedAt,
        input.words ? JSON.stringify(input.words) : null,
        input.cardBoundaries ? JSON.stringify(input.cardBoundaries) : null,
      ],
    );
    return mapPendingDebriefTranscript(rows[0]);
  }

  async getPendingDebriefTranscript(flightId: string): Promise<PendingDebriefTranscript | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM pending_debrief_transcripts WHERE flight_id = $1", [flightId]);
    return rows[0] ? mapPendingDebriefTranscript(rows[0]) : null;
  }

  async deletePendingDebriefTranscript(flightId: string): Promise<void> {
    const db = await this.db();
    await db.query("DELETE FROM pending_debrief_transcripts WHERE flight_id = $1", [flightId]);
  }

  // --- Training items ---

  async listTrainingItems(filter?: ListTrainingItemsFilter): Promise<TrainingItem[]> {
    const db = await this.db();
    if (filter?.studentId) {
      const { rows } = await db.query(
        `SELECT ti.* FROM training_items ti
         JOIN flights f ON f.id = ti.flight_id
         WHERE f.student_id = $1 ${filter.flightId ? "AND ti.flight_id = $2" : ""}
         ORDER BY ti.created_at`,
        filter.flightId ? [filter.studentId, filter.flightId] : [filter.studentId],
      );
      return rows.map(mapTrainingItem);
    }
    if (filter?.flightId) {
      const { rows } = await db.query("SELECT * FROM training_items WHERE flight_id = $1 ORDER BY created_at", [
        filter.flightId,
      ]);
      return rows.map(mapTrainingItem);
    }
    const { rows } = await db.query("SELECT * FROM training_items ORDER BY created_at");
    return rows.map(mapTrainingItem);
  }

  async createTrainingItems(items: Omit<TrainingItem, "id" | "createdAt">[]): Promise<TrainingItem[]> {
    if (items.length === 0) return [];
    const db = await this.db();
    const values = items.map((item) => [
      randomUUID(),
      item.flightId,
      item.debriefId,
      item.category,
      item.description,
      item.done,
      item.completedAt,
      item.visibility,
    ]);
    const { rows } = await db.query(
      `INSERT INTO training_items (id, flight_id, debrief_id, category, description, done, completed_at, visibility)
       VALUES ${buildValuesPlaceholders(values.length, 8)} RETURNING *`,
      values.flat(),
    );
    return rows.map(mapTrainingItem);
  }

  async setTrainingItemDone(id: string, done: boolean): Promise<void> {
    const db = await this.db();
    await db.query(
      "UPDATE training_items SET done = $2, completed_at = CASE WHEN $2 THEN now() ELSE NULL END WHERE id = $1",
      [id, done],
    );
  }

  async updateTrainingItemDescription(id: string, description: string): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE training_items SET description = $2 WHERE id = $1", [id, description]);
  }

  async deleteTrainingItem(id: string): Promise<void> {
    const db = await this.db();
    await db.query("DELETE FROM training_items WHERE id = $1", [id]);
  }

  // --- CFI-authored standing student notes ---

  async listStudentNotes(filter: { studentId: string }): Promise<StudentNote[]> {
    const db = await this.db();
    const { rows } = await db.query(
      "SELECT * FROM student_notes WHERE student_id = $1 ORDER BY created_at",
      [filter.studentId],
    );
    return rows.map(mapStudentNote);
  }

  async createStudentNote(input: CreateStudentNoteInput): Promise<StudentNote> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO student_notes (id, organization_id, student_id, author_user_id, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [randomUUID(), input.organizationId, input.studentId, input.authorUserId, input.description],
    );
    return mapStudentNote(rows[0]);
  }

  async setStudentNoteDone(id: string, done: boolean): Promise<void> {
    const db = await this.db();
    await db.query(
      "UPDATE student_notes SET done = $2, completed_at = CASE WHEN $2 THEN now() ELSE NULL END WHERE id = $1",
      [id, done],
    );
  }

  // --- Content Engine Phase 1: public resources hub ---

  async getAirport(ident: string): Promise<Airport | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM airports WHERE ident = $1", [ident.toUpperCase()]);
    return rows[0] ? mapAirport(rows[0]) : null;
  }

  async getAirportInsights(ident: string): Promise<AirportInsightsRecord | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM airport_insights WHERE airport_ident = $1", [ident.toUpperCase()]);
    return rows[0] ? mapAirportInsights(rows[0]) : null;
  }

  async listAirportsWithInsights(): Promise<Airport[]> {
    const db = await this.db();
    // Joined rather than filtered on a flag: an airport is publishable
    // because a recompute cleared the sample floor for it, not because
    // someone ticked a box.
    const { rows } = await db.query(
      `SELECT a.* FROM airports a JOIN airport_insights i ON i.airport_ident = a.ident ORDER BY a.ident`,
    );
    return rows.map(mapAirport);
  }

  async listResourceTopics(): Promise<ResourceTopic[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM resource_topics ORDER BY name");
    return rows.map(mapResourceTopic);
  }

  async getResourceTopicBySlug(slug: string): Promise<ResourceTopic | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM resource_topics WHERE slug = $1", [slug]);
    return rows[0] ? mapResourceTopic(rows[0]) : null;
  }

  async listArticles(filter: { status?: ArticleStatus; topicId?: string }): Promise<Article[]> {
    const db = await this.db();
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filter.topicId) {
      params.push(filter.topicId);
      conditions.push(`topic_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await db.query(
      `SELECT * FROM articles ${where} ORDER BY COALESCE(published_at, created_at) DESC`,
      params,
    );
    return rows.map(mapArticle);
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM articles WHERE slug = $1", [slug]);
    return rows[0] ? mapArticle(rows[0]) : null;
  }

  async getArticle(id: string): Promise<Article | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM articles WHERE id = $1", [id]);
    return rows[0] ? mapArticle(rows[0]) : null;
  }

  async listArticleIdeas(filter?: { status?: ArticleIdeaStatus }): Promise<ArticleIdea[]> {
    const db = await this.db();
    const { rows } = filter?.status
      ? await db.query("SELECT * FROM article_ideas WHERE status = $1 ORDER BY created_at DESC", [filter.status])
      : await db.query("SELECT * FROM article_ideas ORDER BY created_at DESC");
    return rows.map(mapArticleIdea);
  }

  async getArticleIdea(id: string): Promise<ArticleIdea | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM article_ideas WHERE id = $1", [id]);
    return rows[0] ? mapArticleIdea(rows[0]) : null;
  }

  async createArticleIdeas(inputs: CreateArticleIdeaInput[]): Promise<ArticleIdea[]> {
    if (inputs.length === 0) return [];
    const db = await this.db();
    // One multi-row insert rather than a loop: ideas always arrive as a batch
    // from a single generation call, and a partial batch is worse than none.
    const values: unknown[] = [];
    const groups = inputs.map((input, i) => {
      const base = i * 6;
      values.push(randomUUID(), input.topicId, input.title, input.angle, input.targetQuery, input.rationale);
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`;
    });
    const { rows } = await db.query(
      `INSERT INTO article_ideas (id, topic_id, title, angle, target_query, rationale)
       VALUES ${groups.join(",")} RETURNING *`,
      values,
    );
    return rows.map(mapArticleIdea);
  }

  async setArticleIdeaStatus(
    id: string,
    status: ArticleIdeaStatus,
    articleId?: string | null,
  ): Promise<ArticleIdea | null> {
    const db = await this.db();
    const { rows } = await db.query(
      `UPDATE article_ideas
         SET status = $2,
             article_id = COALESCE($3, article_id),
             decided_at = now()
       WHERE id = $1 RETURNING *`,
      [id, status, articleId ?? null],
    );
    return rows[0] ? mapArticleIdea(rows[0]) : null;
  }

  async createArticle(input: CreateArticleInput): Promise<Article> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO articles (id, slug, topic_id, title, dek, body, author_name, sources, image_url, body_blocks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        randomUUID(),
        input.slug,
        input.topicId,
        input.title,
        input.dek,
        input.body,
        input.authorName,
        JSON.stringify(input.sources ?? []),
        input.imageUrl ?? null,
        input.bodyBlocks ? JSON.stringify(input.bodyBlocks) : null,
      ],
    );
    return mapArticle(rows[0]);
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
    const db = await this.db();
    const current = await this.getArticle(id);
    if (!current) throw new Error(`Article not found: ${id}`);

    const nextStatus = input.status ?? current.status;
    // publishedAt is set the first time an article transitions to published, and never cleared by an edit.
    const publishedAt =
      nextStatus === "published" ? current.publishedAt ?? new Date().toISOString() : current.publishedAt;

    const { rows } = await db.query(
      `UPDATE articles SET slug = $2, topic_id = $3, title = $4, dek = $5, body = $6, author_name = $7,
         sources = $8, image_url = $9, status = $10, published_at = $11, body_blocks = $12, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [
        id,
        input.slug ?? current.slug,
        input.topicId === undefined ? current.topicId : input.topicId,
        input.title ?? current.title,
        input.dek ?? current.dek,
        input.body ?? current.body,
        input.authorName ?? current.authorName,
        JSON.stringify(input.sources ?? current.sources),
        input.imageUrl === undefined ? current.imageUrl : input.imageUrl,
        nextStatus,
        publishedAt,
        input.bodyBlocks === undefined
          ? current.bodyBlocks && JSON.stringify(current.bodyBlocks)
          : input.bodyBlocks && JSON.stringify(input.bodyBlocks),
      ],
    );
    return mapArticle(rows[0]);
  }

  // --- AI/LLM discoverability layer: original research ---

  async listResearchReports(filter: { status?: ArticleStatus }): Promise<ResearchReport[]> {
    const db = await this.db();
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await db.query(
      `SELECT * FROM research_reports ${where} ORDER BY COALESCE(published_at, created_at) DESC`,
      params,
    );
    return rows.map(mapResearchReport);
  }

  async getResearchReportBySlug(slug: string): Promise<ResearchReport | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM research_reports WHERE slug = $1", [slug]);
    return rows[0] ? mapResearchReport(rows[0]) : null;
  }

  async getResearchReport(id: string): Promise<ResearchReport | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM research_reports WHERE id = $1", [id]);
    return rows[0] ? mapResearchReport(rows[0]) : null;
  }

  async createResearchReport(input: CreateResearchReportInput): Promise<ResearchReport> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO research_reports
         (id, slug, title, summary, key_findings, methodology, sample_size, date_range, definitions,
          limitations, anonymization_note, data_source, author_name, reviewer_name, sources, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        randomUUID(),
        input.slug,
        input.title,
        input.summary,
        input.keyFindings ?? null,
        input.methodology ?? null,
        input.sampleSize ?? null,
        input.dateRange ?? null,
        input.definitions ?? null,
        input.limitations ?? null,
        input.anonymizationNote ?? null,
        input.dataSource ?? null,
        input.authorName,
        input.reviewerName ?? null,
        JSON.stringify(input.sources ?? []),
        input.imageUrl ?? null,
      ],
    );
    return mapResearchReport(rows[0]);
  }

  async updateResearchReport(id: string, input: UpdateResearchReportInput): Promise<ResearchReport> {
    const db = await this.db();
    const current = await this.getResearchReport(id);
    if (!current) throw new Error(`Research report not found: ${id}`);

    const nextStatus = input.status ?? current.status;
    const publishedAt =
      nextStatus === "published" ? current.publishedAt ?? new Date().toISOString() : current.publishedAt;

    const { rows } = await db.query(
      `UPDATE research_reports SET slug = $2, title = $3, summary = $4, key_findings = $5, methodology = $6,
         sample_size = $7, date_range = $8, definitions = $9, limitations = $10, anonymization_note = $11,
         data_source = $12, author_name = $13, reviewer_name = $14, sources = $15, image_url = $16, status = $17,
         published_at = $18, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [
        id,
        input.slug ?? current.slug,
        input.title ?? current.title,
        input.summary ?? current.summary,
        input.keyFindings === undefined ? current.keyFindings : input.keyFindings,
        input.methodology === undefined ? current.methodology : input.methodology,
        input.sampleSize === undefined ? current.sampleSize : input.sampleSize,
        input.dateRange === undefined ? current.dateRange : input.dateRange,
        input.definitions === undefined ? current.definitions : input.definitions,
        input.limitations === undefined ? current.limitations : input.limitations,
        input.anonymizationNote === undefined ? current.anonymizationNote : input.anonymizationNote,
        input.dataSource === undefined ? current.dataSource : input.dataSource,
        input.authorName ?? current.authorName,
        input.reviewerName === undefined ? current.reviewerName : input.reviewerName,
        JSON.stringify(input.sources ?? current.sources),
        input.imageUrl === undefined ? current.imageUrl : input.imageUrl,
        nextStatus,
        publishedAt,
      ],
    );
    return mapResearchReport(rows[0]);
  }

  // --- AI/LLM discoverability layer: referral tracking ---

  async createReferralEvent(input: CreateReferralEventInput): Promise<ReferralEvent> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO referral_events (id, path, referrer_source, referrer_host, raw_referrer)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [randomUUID(), input.path, input.referrerSource, input.referrerHost, input.rawReferrer],
    );
    return mapReferralEvent(rows[0]);
  }

  async getReferralSummary(filter: { days: number }): Promise<ReferralSummary> {
    const db = await this.db();
    const [bySource, byPath] = await Promise.all([
      db.query(
        `SELECT referrer_source, count(*)::int AS count FROM referral_events
         WHERE created_at > now() - ($1 || ' days')::interval
         GROUP BY referrer_source ORDER BY count DESC`,
        [filter.days],
      ),
      db.query(
        `SELECT path, referrer_source, count(*)::int AS count FROM referral_events
         WHERE created_at > now() - ($1 || ' days')::interval
         GROUP BY path, referrer_source ORDER BY count DESC LIMIT 20`,
        [filter.days],
      ),
    ]);
    return {
      bySource: bySource.rows.map((r) => ({ source: r.referrer_source as ReferralSource, count: r.count as number })),
      byPath: byPath.rows.map((r) => ({
        path: r.path as string,
        source: r.referrer_source as ReferralSource,
        count: r.count as number,
      })),
    };
  }

  // --- Study-resource "opened" tracking (first-click only, no duration) ---

  async markStudyResourceViewed(input: { studentId: string; url: string }): Promise<void> {
    const db = await this.db();
    await db.query("INSERT INTO study_resource_views (id, student_id, url) VALUES ($1,$2,$3)", [
      randomUUID(),
      input.studentId,
      input.url,
    ]);
  }

  async listViewedStudyResourceUrls(studentId: string): Promise<string[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT DISTINCT url FROM study_resource_views WHERE student_id = $1", [
      studentId,
    ]);
    return rows.map((r) => r.url as string);
  }

  // --- Radio-communications practice ---

  async createRadioPracticeAssignment(input: {
    organizationId: string;
    studentId: string;
    assignedBy: string | null;
    scenarioId: string;
  }): Promise<RadioPracticeAssignment> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO radio_practice_assignments (id, organization_id, student_id, assigned_by, scenario_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [randomUUID(), input.organizationId, input.studentId, input.assignedBy, input.scenarioId],
    );
    return mapRadioPracticeAssignment(rows[0]);
  }

  async listRadioPracticeAssignments(studentId: string): Promise<RadioPracticeAssignment[]> {
    const db = await this.db();
    const { rows } = await db.query(
      "SELECT * FROM radio_practice_assignments WHERE student_id = $1 ORDER BY created_at DESC",
      [studentId],
    );
    return rows.map(mapRadioPracticeAssignment);
  }

  async getRadioPracticeAssignment(id: string): Promise<RadioPracticeAssignment | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM radio_practice_assignments WHERE id = $1", [id]);
    return rows[0] ? mapRadioPracticeAssignment(rows[0]) : null;
  }

  async completeRadioPracticeAssignment(
    id: string,
    result: { transcript: string; correct: boolean; matchedElements: { description: string; matched: boolean }[] },
  ): Promise<RadioPracticeAssignment> {
    const db = await this.db();
    const { rows } = await db.query(
      `UPDATE radio_practice_assignments
       SET status = 'completed', transcript = $2, correct = $3, matched_elements = $4, completed_at = now(), attempts = attempts + 1
       WHERE id = $1 RETURNING *`,
      [id, result.transcript, result.correct, JSON.stringify(result.matchedElements)],
    );
    return mapRadioPracticeAssignment(rows[0]);
  }

  async deleteRadioPracticeAssignment(id: string): Promise<void> {
    const db = await this.db();
    await db.query("DELETE FROM radio_practice_assignments WHERE id = $1", [id]);
  }

  // --- Structured, CFI-led debrief: flight tasks ---

  async listFlightTasks(flightId: string): Promise<FlightTask[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM flight_tasks WHERE flight_id = $1 ORDER BY sort_order", [
      flightId,
    ]);
    return rows.map(mapFlightTask);
  }

  async setFlightTasks(
    flightId: string,
    tasks: { taskCode: string; label: string; source: FlightTaskSource }[],
  ): Promise<FlightTask[]> {
    const db = await this.db();
    await db.query("DELETE FROM flight_tasks WHERE flight_id = $1", [flightId]);
    if (tasks.length === 0) return [];
    const values = tasks.map((t, i) => [randomUUID(), flightId, t.taskCode, t.label, t.source, i]);
    const { rows } = await db.query(
      `INSERT INTO flight_tasks (id, flight_id, task_code, label, source, sort_order)
       VALUES ${buildValuesPlaceholders(values.length, 6)} RETURNING *`,
      values.flat(),
    );
    return rows.map(mapFlightTask);
  }

  // --- Structured, CFI-led debrief: independent assessments ---

  async getOrCreateAssessment(flightId: string, role: AssessmentRole, assessorUserId: string): Promise<DebriefAssessment> {
    const db = await this.db();
    const existing = await db.query("SELECT * FROM debrief_assessments WHERE flight_id = $1 AND role = $2", [
      flightId,
      role,
    ]);
    if (existing.rows[0]) return mapDebriefAssessment(existing.rows[0]);
    const { rows } = await db.query(
      `INSERT INTO debrief_assessments (id, flight_id, role, assessor_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (flight_id, role) DO NOTHING
       RETURNING *`,
      [randomUUID(), flightId, role, assessorUserId],
    );
    if (rows[0]) return mapDebriefAssessment(rows[0]);
    // Lost the race to a concurrent create -- fetch what's there now.
    const { rows: afterConflict } = await db.query(
      "SELECT * FROM debrief_assessments WHERE flight_id = $1 AND role = $2",
      [flightId, role],
    );
    return mapDebriefAssessment(afterConflict[0]);
  }

  async getAssessment(flightId: string, role: AssessmentRole): Promise<DebriefAssessment | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM debrief_assessments WHERE flight_id = $1 AND role = $2", [
      flightId,
      role,
    ]);
    return rows[0] ? mapDebriefAssessment(rows[0]) : null;
  }

  async upsertAssessmentRating(
    assessmentId: string,
    flightTaskId: string,
    level: PerformanceLevelCode,
    note?: string | null,
  ): Promise<void> {
    const db = await this.db();
    await db.query(
      `INSERT INTO debrief_assessment_ratings (id, assessment_id, flight_task_id, performance_level, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (assessment_id, flight_task_id) DO UPDATE SET performance_level = $4, note = $5`,
      [randomUUID(), assessmentId, flightTaskId, level, note ?? null],
    );
  }

  async listAssessmentRatings(assessmentId: string): Promise<DebriefAssessmentRating[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM debrief_assessment_ratings WHERE assessment_id = $1", [
      assessmentId,
    ]);
    return rows.map(mapDebriefAssessmentRating);
  }

  async submitAssessment(assessmentId: string, overallReflection?: string | null): Promise<void> {
    const db = await this.db();
    await db.query(
      "UPDATE debrief_assessments SET status = 'submitted', submitted_at = now(), overall_reflection = COALESCE($2, overall_reflection) WHERE id = $1",
      [assessmentId, overallReflection ?? null],
    );
  }

  // --- Structured, CFI-led debrief: question cards ---

  async listCardDefinitions(organizationId?: string): Promise<CardDefinition[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM card_definitions WHERE organization_id IS NULL AND active ORDER BY default_priority");
    const globals = rows.map(mapCardDefinition);
    if (!organizationId) return globals;
    const { rows: orgRows } = await db.query(
      "SELECT * FROM card_definitions WHERE organization_id = $1 AND active ORDER BY default_priority",
      [organizationId],
    );
    const overrides = orgRows.map(mapCardDefinition);
    const overrideCodes = new Set(overrides.map((c) => c.code));
    return [...overrides, ...globals.filter((c) => !overrideCodes.has(c.code))];
  }

  async listCards(flightId: string): Promise<DebriefCard[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM debrief_cards WHERE flight_id = $1 ORDER BY sort_order", [
      flightId,
    ]);
    return rows.map(mapDebriefCard);
  }

  async createCards(cards: Omit<DebriefCard, "id" | "createdAt">[]): Promise<DebriefCard[]> {
    if (cards.length === 0) return [];
    const db = await this.db();
    const values = cards.map((c) => [
      randomUUID(),
      c.flightId,
      c.cardDefinitionId,
      c.flightTaskId,
      c.source,
      c.category,
      c.title,
      c.primaryPrompt,
      c.followUpPrompts,
      c.acsArea,
      c.acsAreaUrl,
      c.studentRating,
      c.instructorRating,
      c.discrepancyStatus,
      c.sortOrder,
      c.status,
      c.flaggedForFollowUp,
      c.recordingStartSeconds,
      c.recordingEndSeconds,
    ]);
    const { rows } = await db.query(
      `INSERT INTO debrief_cards (
         id, flight_id, card_definition_id, flight_task_id, source, category, title, primary_prompt,
         follow_up_prompts, acs_area, acs_area_url, student_rating, instructor_rating, discrepancy_status,
         sort_order, status, flagged_for_follow_up, recording_start_seconds, recording_end_seconds
       ) VALUES ${buildValuesPlaceholders(values.length, 19)} RETURNING *`,
      values.flat(),
    );
    return rows.map(mapDebriefCard);
  }

  async updateCardStatus(cardId: string, status: DebriefCard["status"]): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE debrief_cards SET status = $2 WHERE id = $1", [cardId, status]);
  }

  async updateCardTiming(cardId: string, startSeconds: number, endSeconds: number): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE debrief_cards SET recording_start_seconds = $2, recording_end_seconds = $3 WHERE id = $1", [
      cardId,
      startSeconds,
      endSeconds,
    ]);
  }

  async setCardFlaggedForFollowUp(cardId: string, flagged: boolean): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE debrief_cards SET flagged_for_follow_up = $2 WHERE id = $1", [cardId, flagged]);
  }

  async reorderCards(orderedCardIds: string[]): Promise<void> {
    if (orderedCardIds.length === 0) return;
    const db = await this.db();
    await Promise.all(orderedCardIds.map((id, i) => db.query("UPDATE debrief_cards SET sort_order = $2 WHERE id = $1", [id, i])));
  }

  // --- Structured, CFI-led debrief: transcript segments ---

  async createTranscriptSegments(
    segments: Omit<TranscriptSegment, "id" | "createdAt">[],
  ): Promise<TranscriptSegment[]> {
    if (segments.length === 0) return [];
    const db = await this.db();
    const values = segments.map((s) => [
      randomUUID(),
      s.flightId,
      s.debriefCardId,
      s.startSeconds,
      s.endSeconds,
      s.text,
      s.speakerLabel,
    ]);
    const { rows } = await db.query(
      `INSERT INTO debrief_transcript_segments (id, flight_id, debrief_card_id, start_seconds, end_seconds, text, speaker_label)
       VALUES ${buildValuesPlaceholders(values.length, 7)} RETURNING *`,
      values.flat(),
    );
    return rows.map(mapTranscriptSegment);
  }

  async listTranscriptSegments(flightId: string): Promise<TranscriptSegment[]> {
    const db = await this.db();
    const { rows } = await db.query(
      "SELECT * FROM debrief_transcript_segments WHERE flight_id = $1 ORDER BY start_seconds",
      [flightId],
    );
    return rows.map(mapTranscriptSegment);
  }

  // --- Identity / organizations ---

  async getUser(id: string): Promise<User | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async markGuideStepViewed(userId: string, key: string): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE users SET guide_progress = jsonb_set(guide_progress, ARRAY[$2], 'true'::jsonb) WHERE id = $1", [
      userId,
      key,
    ]);
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

  async createOrganization(input: { id?: string; name: string; kind: Organization["kind"] }): Promise<Organization> {
    const db = await this.db();
    const { rows } = await db.query(
      "INSERT INTO organizations (id, name, kind) VALUES ($1, $2, $3) RETURNING *",
      [input.id ?? `org-${randomUUID()}`, input.name, input.kind],
    );
    return mapOrganization(rows[0]);
  }

  async getOrganizationByStripeCustomerId(stripeCustomerId: string): Promise<Organization | null> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM organizations WHERE stripe_customer_id = $1", [stripeCustomerId]);
    return rows[0] ? mapOrganization(rows[0]) : null;
  }

  async renameOrganization(id: string, name: string): Promise<Organization | null> {
    const db = await this.db();
    const { rows } = await db.query("UPDATE organizations SET name = $2 WHERE id = $1 RETURNING *", [id, name.trim()]);
    return rows[0] ? mapOrganization(rows[0]) : null;
  }

  async updateOrganizationBilling(
    id: string,
    billing: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      subscriptionStatus?: string | null;
      subscriptionPlan?: Organization["subscriptionPlan"];
      subscriptionQuantity?: number;
    },
  ): Promise<Organization> {
    const db = await this.db();
    const { rows } = await db.query(
      `UPDATE organizations SET
         stripe_customer_id = COALESCE($2, stripe_customer_id),
         stripe_subscription_id = COALESCE($3, stripe_subscription_id),
         subscription_status = COALESCE($4, subscription_status),
         subscription_plan = COALESCE($5, subscription_plan),
         subscription_quantity = COALESCE($6, subscription_quantity)
       WHERE id = $1 RETURNING *`,
      [
        id,
        billing.stripeCustomerId ?? null,
        billing.stripeSubscriptionId ?? null,
        billing.subscriptionStatus ?? null,
        billing.subscriptionPlan ?? null,
        billing.subscriptionQuantity ?? null,
      ],
    );
    if (!rows[0]) throw new Error(`Organization ${id} not found`);
    return mapOrganization(rows[0]);
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

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO reservations (id, organization_id, student_id, instructor_id, aircraft_id, scheduled_start, scheduled_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        randomUUID(),
        input.organizationId,
        input.studentId,
        input.instructorId,
        input.aircraftId,
        input.scheduledStart,
        input.scheduledEnd,
      ],
    );
    return mapReservation(rows[0]);
  }

  async updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation | null> {
    // Built dynamically so an unspecified field keeps its current value rather
    // than being overwritten with null by a fixed column list.
    const sets: string[] = [];
    const values: unknown[] = [];
    const push = (column: string, value: unknown) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };
    if (input.scheduledStart !== undefined) push("scheduled_start", input.scheduledStart);
    if (input.scheduledEnd !== undefined) push("scheduled_end", input.scheduledEnd);
    if (input.aircraftId !== undefined) push("aircraft_id", input.aircraftId);
    if (input.instructorId !== undefined) push("instructor_id", input.instructorId);
    if (sets.length === 0) return this.getReservation(id);

    values.push(id);
    const db = await this.db();
    const { rows } = await db.query(
      `UPDATE reservations SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return rows[0] ? mapReservation(rows[0]) : null;
  }

  async cancelReservation(id: string): Promise<void> {
    const db = await this.db();
    await db.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1`, [id]);
  }

  // --- Structured training signals ---

  async createTrainingSignals(items: Omit<TrainingSignal, "id" | "createdAt">[]): Promise<TrainingSignal[]> {
    if (items.length === 0) return [];
    const db = await this.db();
    const values = items.map((item) => [
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
      item.dismissed,
    ]);
    const { rows } = await db.query(
      `INSERT INTO training_signals (
         id, organization_id, student_id, instructor_id, aircraft_id, flight_id, debrief_id,
         flight_date, category, skill, status, source, statement, dismissed
       ) VALUES ${buildValuesPlaceholders(values.length, 14)} RETURNING *`,
      values.flat(),
    );
    return rows.map(mapTrainingSignal);
  }

  async setTrainingSignalDismissed(id: string, dismissed: boolean): Promise<void> {
    const db = await this.db();
    await db.query("UPDATE training_signals SET dismissed = $2 WHERE id = $1", [id, dismissed]);
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

  // --- Rewards Phase 1: milestones (see lib/milestones.ts) ---

  async listMilestones(studentId: string): Promise<Milestone[]> {
    const db = await this.db();
    const { rows } = await db.query(
      "SELECT * FROM milestones WHERE student_id = $1 ORDER BY achieved_at DESC",
      [studentId],
    );
    return rows.map(mapMilestone);
  }

  async createMilestoneIfNew(input: Omit<Milestone, "id" | "createdAt" | "achievedAt">): Promise<Milestone | null> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO milestones (id, student_id, type, source, related_flight_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, type) DO NOTHING
       RETURNING *`,
      [randomUUID(), input.studentId, input.type, input.source, input.relatedFlightId, JSON.stringify(input.metadata)],
    );
    return rows[0] ? mapMilestone(rows[0]) : null;
  }

  // --- Recording consent (V1 change 12) ---

  async createConsentRecord(input: {
    flightId: string;
    participantUserId: string;
    participantRole: "student" | "instructor";
    status: "granted" | "declined";
  }): Promise<ConsentRecord> {
    const db = await this.db();
    const { rows } = await db.query(
      `INSERT INTO consent_records (id, flight_id, participant_user_id, participant_role, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [randomUUID(), input.flightId, input.participantUserId, input.participantRole, input.status],
    );
    return mapConsentRecord(rows[0]);
  }

  async listConsentRecords(flightId: string): Promise<ConsentRecord[]> {
    const db = await this.db();
    const { rows } = await db.query("SELECT * FROM consent_records WHERE flight_id = $1 ORDER BY created_at ASC", [
      flightId,
    ]);
    return rows.map(mapConsentRecord);
  }

  // --- Revenue share (V1 change 10) -- data relationships only ---

  async getSubscription(userId: string): Promise<Subscription | null> {
    const db = await this.db();
    const { rows } = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    return rows[0] ? mapSubscription(rows[0]) : null;
  }

  async computeRevenueShareQualification(
    studentId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<{ qualifyingCfiId: string | null; qualifyingSchoolOrgId: string | null }> {
    const db = await this.db();
    // A qualifying debrief: a real, completed debrief for this student within
    // the period. instructor_id/organization_id come straight off that
    // flight -- no proficiency, rating, or FlightScore input anywhere here.
    const { rows } = await db.query(
      `SELECT f.instructor_id, f.organization_id, o.kind AS organization_kind
       FROM flights f
       JOIN debriefs d ON d.flight_id = f.id
       LEFT JOIN organizations o ON o.id = f.organization_id
       WHERE f.student_id = $1 AND f.flight_date >= $2 AND f.flight_date <= $3
       ORDER BY f.flight_date DESC
       LIMIT 1`,
      [studentId, periodStart, periodEnd],
    );
    const row = rows[0];
    if (!row) return { qualifyingCfiId: null, qualifyingSchoolOrgId: null };
    return {
      qualifyingCfiId: (row.instructor_id as string | null) ?? null,
      qualifyingSchoolOrgId: row.organization_kind === "school" ? (row.organization_id as string | null) : null,
    };
  }

  async listInstructorSkillObservations(studentId: string): Promise<SkillObservation[]> {
    const db = await this.db();
    const { rows } = await db.query(
      `SELECT f.id AS flight_id, f.flight_date, f.aircraft_id, ft.task_code, ft.label AS task_label,
              r.performance_level, r.note, da.submitted_at
       FROM debrief_assessment_ratings r
       JOIN debrief_assessments da ON da.id = r.assessment_id
       JOIN flight_tasks ft ON ft.id = r.flight_task_id
       JOIN flights f ON f.id = ft.flight_id
       WHERE da.role = 'instructor' AND da.status = 'submitted' AND f.student_id = $1
       ORDER BY f.flight_date ASC, da.submitted_at ASC`,
      [studentId],
    );
    return rows.map(mapSkillObservation);
  }
}

/**
 * Demo seeding is strictly opt-in: it requires SEED_DEMO_DATA to be set to a
 * truthy value ("1"/"true"/"yes") and never runs inside a Replit deployment,
 * so a fresh production database starts empty except for real identity data.
 */
export function shouldSeedDemoData(): boolean {
  if (process.env.REPLIT_DEPLOYMENT) return false;
  const flag = (process.env.SEED_DEMO_DATA ?? "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

// --- SQL helpers ---------------------------------------------------------------

/** Builds "($1,$2,...),($n+1,...)" placeholder groups for a multi-row INSERT. */
function buildValuesPlaceholders(rowCount: number, columnCount: number): string {
  const groups: string[] = [];
  for (let row = 0; row < rowCount; row++) {
    const offset = row * columnCount;
    const params = Array.from({ length: columnCount }, (_, col) => `$${offset + col + 1}`);
    groups.push(`(${params.join(",")})`);
  }
  return groups.join(",");
}

// --- Seeding ----------------------------------------------------------------

async function seedDomainTables(client: PoolClient): Promise<void> {
  const seed = buildSeed();
  // Identity rows first (org, users, memberships) so the domain rows' foreign
  // keys resolve even on a database that was initialized without demo data.
  for (const o of seed.organizations) {
    await client.query(
      "INSERT INTO organizations (id, name, kind) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [o.id, o.name, o.kind],
    );
  }
  for (const u of seed.users) {
    await client.query(
      "INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [u.id, u.name, u.email],
    );
  }
  for (const m of seed.organizationMembers) {
    await client.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, certificate_type)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.organizationId, m.userId, m.role, m.certificateType ?? null],
    );
  }
  for (const { instructor: i, organizationId } of seed.instructors) {
    await client.query(
      "INSERT INTO instructors (id, name, organization_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [i.id, i.name, organizationId],
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
    profileCompleted: Boolean(row.profile_completed),
    avatarUrl: (row.avatar_url as string | null) ?? null,
    createdAt: iso(row.created_at),
    guideProgress: (row.guide_progress as Record<string, boolean> | null) ?? {},
  };
}

function mapOrganization(row: Row): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as Organization["kind"],
    defaultGuidanceMode: row.default_guidance_mode as Organization["defaultGuidanceMode"],
    stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    subscriptionStatus: (row.subscription_status as string | null) ?? null,
    subscriptionPlan: (row.subscription_plan as Organization["subscriptionPlan"]) ?? null,
    subscriptionQuantity: row.subscription_quantity as number,
    demoExpiresAt: row.demo_expires_at ? iso(row.demo_expires_at) : null,
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
    structuredResult: normalizeStructuredResult(row.structured_result as Partial<Debrief["structuredResult"]> | null),
    analyzedWith: row.analyzed_with as Debrief["analyzedWith"],
    guidanceMode: (row.guidance_mode as Debrief["guidanceMode"]) ?? "freeform",
    recordingStartedAt: row.recording_started_at ? iso(row.recording_started_at) : null,
    recordingEndedAt: row.recording_ended_at ? iso(row.recording_ended_at) : null,
    createdAt: iso(row.created_at),
  };
}

function mapPendingDebriefTranscript(row: Row): PendingDebriefTranscript {
  return {
    flightId: row.flight_id as string,
    transcript: row.transcript as string,
    audioDurationSeconds: row.audio_duration_seconds as number,
    guidanceMode: (row.guidance_mode as PendingDebriefTranscript["guidanceMode"]) ?? "freeform",
    recordingStartedAt: row.recording_started_at ? iso(row.recording_started_at) : null,
    recordingEndedAt: row.recording_ended_at ? iso(row.recording_ended_at) : null,
    words: (row.words as PendingDebriefTranscript["words"]) ?? null,
    cardBoundaries: (row.card_boundaries as PendingDebriefTranscript["cardBoundaries"]) ?? null,
    createdAt: iso(row.created_at),
  };
}

/**
 * Debrief rows created before a given StructuredDebrief field existed are
 * missing that key entirely in the stored JSON, not just empty -- every page
 * that reads a debrief assumes each array field is always present (never
 * undefined), so this backfills defaults for whatever an older row lacks
 * instead of crashing pages that .map() over them.
 */
function normalizeStructuredResult(result: Partial<Debrief["structuredResult"]> | null): Debrief["structuredResult"] {
  const r = result ?? {};
  return {
    flightSummary: r.flightSummary ?? "",
    narrativeRecap: r.narrativeRecap ?? "",
    whatWeDid: r.whatWeDid ?? [],
    wentWell: r.wentWell ?? [],
    needsWork: r.needsWork ?? [],
    instructorGuidance: r.instructorGuidance ?? [],
    instructorAssistance: r.instructorAssistance ?? [],
    riskManagementNotes: r.riskManagementNotes ?? [],
    assessmentDifferences: r.assessmentDifferences ?? [],
    actionItems: r.actionItems ?? [],
    nextLessonFocus: r.nextLessonFocus ?? [],
    studyReferences: r.studyReferences ?? [],
    nextFlightCue: r.nextFlightCue ?? "",
    nextFlightCueContext: r.nextFlightCueContext ?? "",
  };
}

function mapFlightTask(row: Row): FlightTask {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    taskCode: row.task_code as FlightTask["taskCode"],
    label: row.label as string,
    source: row.source as FlightTask["source"],
    sortOrder: row.sort_order as number,
    createdAt: iso(row.created_at),
  };
}

function mapRadioPracticeAssignment(row: Row): RadioPracticeAssignment {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    studentId: row.student_id as string,
    assignedBy: (row.assigned_by as string | null) ?? null,
    scenarioId: row.scenario_id as string,
    status: row.status as RadioPracticeAssignment["status"],
    transcript: (row.transcript as string | null) ?? null,
    correct: (row.correct as boolean | null) ?? null,
    matchedElements: (row.matched_elements as RadioPracticeAssignment["matchedElements"]) ?? null,
    attempts: row.attempts as number,
    completedAt: row.completed_at ? iso(row.completed_at) : null,
    createdAt: iso(row.created_at),
  };
}

function mapDebriefAssessment(row: Row): DebriefAssessment {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    role: row.role as DebriefAssessment["role"],
    assessorUserId: row.assessor_user_id as string,
    status: row.status as DebriefAssessment["status"],
    submittedAt: row.submitted_at ? iso(row.submitted_at) : null,
    overallReflection: (row.overall_reflection as string | null) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapDebriefAssessmentRating(row: Row): DebriefAssessmentRating {
  return {
    id: row.id as string,
    assessmentId: row.assessment_id as string,
    flightTaskId: row.flight_task_id as string,
    performanceLevel: row.performance_level as DebriefAssessmentRating["performanceLevel"],
    note: (row.note as string | null) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapSkillObservation(row: Row): SkillObservation {
  return {
    flightId: row.flight_id as string,
    flightDate: row.flight_date as string,
    aircraftId: row.aircraft_id as string,
    taskCode: row.task_code as SkillObservation["taskCode"],
    taskLabel: row.task_label as string,
    performanceLevel: row.performance_level as SkillObservation["performanceLevel"],
    note: (row.note as string | null) ?? null,
    submittedAt: iso(row.submitted_at),
  };
}

function mapCardDefinition(row: Row): CardDefinition {
  return {
    id: row.id as string,
    organizationId: (row.organization_id as string | null) ?? null,
    code: row.code as string,
    category: row.category as CardDefinition["category"],
    title: row.title as string,
    primaryPrompt: row.primary_prompt as string,
    followUpPrompts: (row.follow_up_prompts as string[] | null) ?? [],
    appliesToTaskCode: (row.applies_to_task_code as CardDefinition["appliesToTaskCode"]) ?? null,
    defaultPriority: row.default_priority as number,
    active: row.active as boolean,
    createdAt: iso(row.created_at),
  };
}

function mapDebriefCard(row: Row): DebriefCard {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    cardDefinitionId: (row.card_definition_id as string | null) ?? null,
    flightTaskId: (row.flight_task_id as string | null) ?? null,
    source: row.source as DebriefCard["source"],
    category: row.category as DebriefCard["category"],
    title: row.title as string,
    primaryPrompt: row.primary_prompt as string,
    followUpPrompts: (row.follow_up_prompts as string[] | null) ?? [],
    acsArea: (row.acs_area as string | null) ?? null,
    acsAreaUrl: (row.acs_area_url as string | null) ?? null,
    studentRating: (row.student_rating as DebriefCard["studentRating"]) ?? null,
    instructorRating: (row.instructor_rating as DebriefCard["instructorRating"]) ?? null,
    discrepancyStatus: row.discrepancy_status as DebriefCard["discrepancyStatus"],
    sortOrder: row.sort_order as number,
    status: row.status as DebriefCard["status"],
    flaggedForFollowUp: row.flagged_for_follow_up as boolean,
    recordingStartSeconds: row.recording_start_seconds !== null ? Number(row.recording_start_seconds) : null,
    recordingEndSeconds: row.recording_end_seconds !== null ? Number(row.recording_end_seconds) : null,
    createdAt: iso(row.created_at),
  };
}

function mapTranscriptSegment(row: Row): TranscriptSegment {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    debriefCardId: (row.debrief_card_id as string | null) ?? null,
    startSeconds: Number(row.start_seconds),
    endSeconds: Number(row.end_seconds),
    text: row.text as string,
    speakerLabel: (row.speaker_label as string | null) ?? null,
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

function mapStudentNote(row: Row): StudentNote {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    studentId: row.student_id as string,
    authorUserId: row.author_user_id as string,
    description: row.description as string,
    done: row.done as boolean,
    completedAt: row.completed_at ? iso(row.completed_at) : null,
    createdAt: iso(row.created_at),
  };
}

function mapResourceTopic(row: Row): ResourceTopic {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
  };
}

function mapArticleIdea(row: Row): ArticleIdea {
  return {
    id: row.id as string,
    topicId: (row.topic_id as string | null) ?? null,
    title: row.title as string,
    angle: row.angle as string,
    targetQuery: row.target_query as string,
    rationale: row.rationale as string,
    status: row.status as ArticleIdeaStatus,
    articleId: (row.article_id as string | null) ?? null,
    decidedAt: row.decided_at ? iso(row.decided_at) : null,
    createdAt: iso(row.created_at),
  };
}

function mapArticle(row: Row): Article {
  return {
    id: row.id as string,
    slug: row.slug as string,
    topicId: (row.topic_id as string | null) ?? null,
    title: row.title as string,
    dek: row.dek as string,
    body: row.body as string,
    status: row.status as ArticleStatus,
    authorName: row.author_name as string,
    sources: (row.sources as Source[] | null) ?? [],
    imageUrl: (row.image_url as string | null) ?? null,
    bodyBlocks: (row.body_blocks as ArticleBody | null) ?? null,
    publishedAt: row.published_at ? iso(row.published_at) : null,
    updatedAt: iso(row.updated_at),
    createdAt: iso(row.created_at),
  };
}

function mapResearchReport(row: Row): ResearchReport {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    summary: row.summary as string,
    keyFindings: (row.key_findings as string | null) ?? null,
    methodology: (row.methodology as string | null) ?? null,
    sampleSize: (row.sample_size as string | null) ?? null,
    dateRange: (row.date_range as string | null) ?? null,
    definitions: (row.definitions as string | null) ?? null,
    limitations: (row.limitations as string | null) ?? null,
    anonymizationNote: (row.anonymization_note as string | null) ?? null,
    dataSource: (row.data_source as string | null) ?? null,
    authorName: row.author_name as string,
    reviewerName: (row.reviewer_name as string | null) ?? null,
    sources: (row.sources as Source[] | null) ?? [],
    imageUrl: (row.image_url as string | null) ?? null,
    status: row.status as ArticleStatus,
    publishedAt: row.published_at ? iso(row.published_at) : null,
    updatedAt: iso(row.updated_at),
    createdAt: iso(row.created_at),
  };
}

function mapReferralEvent(row: Row): ReferralEvent {
  return {
    id: row.id as string,
    path: row.path as string,
    referrerSource: row.referrer_source as ReferralSource,
    referrerHost: (row.referrer_host as string | null) ?? null,
    rawReferrer: (row.raw_referrer as string | null) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapMilestone(row: Row): Milestone {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    type: row.type as string,
    source: row.source as Milestone["source"],
    achievedAt: iso(row.achieved_at),
    relatedFlightId: (row.related_flight_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
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
    dismissed: Boolean(row.dismissed),
    createdAt: iso(row.created_at),
  };
}

function mapConsentRecord(row: Row): ConsentRecord {
  return {
    id: row.id as string,
    flightId: row.flight_id as string,
    participantUserId: row.participant_user_id as string,
    participantRole: row.participant_role as ConsentRecord["participantRole"],
    status: row.status as ConsentRecord["status"],
    recordedAt: iso(row.recorded_at),
    createdAt: iso(row.created_at),
  };
}

function mapSubscription(row: Row): Subscription {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    plan: row.plan as Subscription["plan"],
    status: row.status as Subscription["status"],
    currentPeriodStart: iso(row.current_period_start),
    currentPeriodEnd: row.current_period_end ? iso(row.current_period_end) : null,
    createdAt: iso(row.created_at),
  };
}


function mapAirport(row: Record<string, unknown>): Airport {
  return {
    ident: row.ident as string,
    name: row.name as string,
    municipality: (row.municipality as string) ?? null,
    region: (row.region as string) ?? null,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    isTrainingField: Boolean(row.is_training_field),
  };
}

function mapAirportInsights(row: Record<string, unknown>): AirportInsightsRecord {
  const asDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
  return {
    airportIdent: row.airport_ident as string,
    windowStart: asDate(row.window_start),
    windowEnd: asDate(row.window_end),
    sampleSize: Number(row.sample_size),
    busiestHours: (row.busiest_hours as AirportInsightsRecord["busiestHours"]) ?? [],
    busiestDays: (row.busiest_days as AirportInsightsRecord["busiestDays"]) ?? [],
    runwayUse: (row.runway_use as AirportInsightsRecord["runwayUse"]) ?? [],
    byMonth: (row.by_month as AirportInsightsRecord["byMonth"]) ?? [],
    bySeason: (row.by_season as AirportInsightsRecord["bySeason"]) ?? [],
    commonDestinations: (row.common_destinations as AirportInsightsRecord["commonDestinations"]) ?? [],
    sources: (row.sources as string[]) ?? [],
    computedAt: row.computed_at instanceof Date ? (row.computed_at as Date).toISOString() : String(row.computed_at),
  };
}
