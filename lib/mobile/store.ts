import { getDb } from "@/lib/db";
import type { MobileSession } from "@/lib/mobile/ingest";

/**
 * Persistence for in-progress mobile recordings.
 *
 * Thin on purpose -- all the interesting behavior (idempotency, dedupe,
 * ordering, normalization) lives in lib/mobile/ingest.ts as pure functions,
 * and this module only moves the document in and out. Keeping them separate is
 * what let the ingestion rules be tested without a database.
 */

export async function saveSession(userId: string, session: MobileSession): Promise<void> {
  const db = getDb();
  await db.query(
    `INSERT INTO mobile_recording_sessions
       (id, user_id, t0, aircraft_tail, instructor_id, device, session, ended_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (id) DO UPDATE SET
       session = EXCLUDED.session,
       ended_at = EXCLUDED.ended_at,
       updated_at = now()`,
    [
      session.id,
      userId,
      session.t0,
      session.aircraftTail,
      session.instructorId,
      JSON.stringify(session.device),
      JSON.stringify(session),
      session.endedAt ? new Date(session.endedAt).toISOString() : null,
    ],
  );
}

export async function loadSession(userId: string, id: string): Promise<MobileSession | null> {
  const db = getDb();
  // Scoped by user_id, not just id: session ids are client-generated, so an id
  // alone must never be enough to read someone else's flight.
  const { rows } = await db.query<{ session: MobileSession }>(
    `SELECT session FROM mobile_recording_sessions WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0]?.session ?? null;
}

/** The unfinished session, for the recovery screen on app relaunch. */
export async function loadActiveSession(userId: string): Promise<MobileSession | null> {
  const db = getDb();
  const { rows } = await db.query<{ session: MobileSession }>(
    `SELECT session FROM mobile_recording_sessions
     WHERE user_id = $1 AND ended_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  return rows[0]?.session ?? null;
}

export async function attachFlight(sessionId: string, flightId: string): Promise<void> {
  const db = getDb();
  await db.query(`UPDATE mobile_recording_sessions SET flight_id = $2, updated_at = now() WHERE id = $1`, [
    sessionId,
    flightId,
  ]);
}
