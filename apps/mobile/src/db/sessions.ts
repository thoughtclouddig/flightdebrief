import { getDb } from "./schema";

export type SessionState = "ACTIVE" | "ENDED";
export type SyncState = "PENDING" | "SYNCING" | "ACKNOWLEDGED";

export interface LocalSession {
  id: string;
  remoteSessionId: string | null;
  remoteFlightId: string | null;
  t0: number;
  aircraftTail: string;
  aircraftType: string | null;
  instructor: string | null;
  flightType: "instructor" | "solo";
  state: SessionState;
  startedAt: number;
  endedAt: number | null;
  syncState: SyncState;
}

export interface LocalFix {
  nativeTimestamp: number;
  t: number;
  lat: number;
  lon: number;
  altitudeM: number | null;
  accuracyM: number | null;
  altitudeAccuracyM: number | null;
  courseDeg: number | null;
  speedMps: number | null;
}

export async function createLocalSession(s: Omit<LocalSession, "remoteSessionId" | "remoteFlightId" | "endedAt" | "syncState" | "state">) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO recording_sessions
       (id, t0, aircraft_tail, aircraft_type, instructor, flight_type, state, started_at)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
    [s.id, s.t0, s.aircraftTail, s.aircraftType, s.instructor, s.flightType, s.startedAt],
  );
}

/**
 * Persist one fix.
 *
 * INSERT OR IGNORE against the unique (session, t) index rather than a
 * read-then-write: the background task fires from a native callback with no
 * guarantee about concurrency, and a check-then-insert would race.
 */
export async function insertFix(sessionId: string, f: LocalFix): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO telemetry_fixes
       (session_id, native_timestamp, t, lat, lon, altitude_m, accuracy_m, altitude_accuracy_m, course_deg, speed_mps)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, f.nativeTimestamp, f.t, f.lat, f.lon, f.altitudeM, f.accuracyM, f.altitudeAccuracyM, f.courseDeg, f.speedMps],
  );
}

export async function getActiveSession(): Promise<LocalSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM recording_sessions WHERE state = 'ACTIVE' ORDER BY started_at DESC LIMIT 1`,
  );
  return row ? toSession(row) : null;
}

export async function countFixes(sessionId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM telemetry_fixes WHERE session_id = ?`,
    [sessionId],
  );
  return row?.n ?? 0;
}

/**
 * The next batch to upload.
 *
 * Bounded, because a 90-minute flight at 1 Hz is over five thousand fixes and
 * one request that size will time out on ramp cellular and then be retried in
 * full, forever.
 */
export async function nextPendingBatch(sessionId: string, limit = 500): Promise<LocalFix[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM telemetry_fixes WHERE session_id = ? AND upload_state = 'PENDING' ORDER BY t LIMIT ?`,
    [sessionId, limit],
  );
  return rows.map(toFix);
}

export async function markBatchSent(sessionId: string, key: string, fixes: LocalFix[]): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_batches (idempotency_key, session_id, created_at, fix_count, ack_status)
     VALUES (?, ?, ?, ?, 'SYNCING')`,
    [key, sessionId, Date.now(), fixes.length],
  );
  for (const f of fixes) {
    await db.runAsync(
      `UPDATE telemetry_fixes SET upload_state = 'SYNCING', batch_key = ? WHERE session_id = ? AND t = ?`,
      [key, sessionId, f.t],
    );
  }
}

/**
 * Only on a real acknowledgement.
 *
 * Fixes stay locally until the server confirms. Deleting on send would mean a
 * response lost in the air costs the flight, and a flight cannot be re-flown.
 */
export async function acknowledgeBatch(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE sync_batches SET ack_status = 'ACKNOWLEDGED' WHERE idempotency_key = ?`, [key]);
  await db.runAsync(`UPDATE telemetry_fixes SET upload_state = 'ACKNOWLEDGED' WHERE batch_key = ?`, [key]);
}

/** A failed send goes back to PENDING under the SAME key, so the retry is idempotent. */
export async function releaseBatch(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE telemetry_fixes SET upload_state = 'PENDING' WHERE batch_key = ?`, [key]);
}

export async function endLocalSession(sessionId: string, endedAt: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE recording_sessions SET state = 'ENDED', ended_at = ? WHERE id = ?`, [endedAt, sessionId]);
}

export async function setRemoteIds(sessionId: string, remoteSessionId: string | null, remoteFlightId: string | null) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE recording_sessions SET remote_session_id = COALESCE(?, remote_session_id),
                                   remote_flight_id = COALESCE(?, remote_flight_id) WHERE id = ?`,
    [remoteSessionId, remoteFlightId, sessionId],
  );
}

function toSession(r: Record<string, unknown>): LocalSession {
  return {
    id: String(r.id),
    remoteSessionId: (r.remote_session_id as string) ?? null,
    remoteFlightId: (r.remote_flight_id as string) ?? null,
    t0: Number(r.t0),
    aircraftTail: String(r.aircraft_tail),
    aircraftType: (r.aircraft_type as string) ?? null,
    instructor: (r.instructor as string) ?? null,
    flightType: r.flight_type === "solo" ? "solo" : "instructor",
    state: r.state === "ENDED" ? "ENDED" : "ACTIVE",
    startedAt: Number(r.started_at),
    endedAt: r.ended_at == null ? null : Number(r.ended_at),
    syncState: (r.sync_state as SyncState) ?? "PENDING",
  };
}

function toFix(r: Record<string, unknown>): LocalFix {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    nativeTimestamp: Number(r.native_timestamp),
    t: Number(r.t),
    lat: Number(r.lat),
    lon: Number(r.lon),
    altitudeM: num(r.altitude_m),
    accuracyM: num(r.accuracy_m),
    altitudeAccuracyM: num(r.altitude_accuracy_m),
    courseDeg: num(r.course_deg),
    speedMps: num(r.speed_mps),
  };
}
