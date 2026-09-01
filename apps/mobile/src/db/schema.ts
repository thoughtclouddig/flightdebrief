import * as SQLite from "expo-sqlite";

/**
 * Local-first storage.
 *
 * Every fix is written here before it is considered recorded. Not "recorded
 * when uploaded" -- the phone is offline for the whole flight, and a design
 * that treats the network as part of the write path loses the flight the first
 * time a student flies out of coverage. Which is most flights.
 *
 * Three tables because they have three different lifetimes: a session outlives
 * the app process, a fix outlives the session's upload, and a batch record
 * outlives the request that sent it. Collapsing them would mean a retry cannot
 * tell what it already sent.
 */
const DDL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS recording_sessions (
  id TEXT PRIMARY KEY,
  remote_session_id TEXT,
  remote_flight_id TEXT,
  -- Epoch ms of the START FLIGHT tap. Never of the first GPS fix: t0 is the
  -- origin cockpit audio and video will later stamp against, and it cannot
  -- wait for the receiver to acquire.
  t0 INTEGER NOT NULL,
  aircraft_tail TEXT NOT NULL,
  aircraft_type TEXT,
  instructor TEXT,
  flight_type TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  sync_state TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS telemetry_fixes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  -- The OS timestamp, kept alongside the derived offset so a clock change
  -- mid-flight is diagnosable rather than silently corrupting the timeline.
  native_timestamp INTEGER NOT NULL,
  t INTEGER NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  -- NULL where the device did not report. Never zero-filled.
  altitude_m REAL,
  accuracy_m REAL,
  altitude_accuracy_m REAL,
  course_deg REAL,
  speed_mps REAL,
  upload_state TEXT NOT NULL DEFAULT 'PENDING',
  batch_key TEXT
);

CREATE INDEX IF NOT EXISTS fixes_session_idx ON telemetry_fixes (session_id, t);
CREATE INDEX IF NOT EXISTS fixes_pending_idx ON telemetry_fixes (session_id, upload_state);
-- One row per (session, t). The OS delivers duplicates after a resume, and a
-- duplicate here would survive into the track as a stalled aircraft.
CREATE UNIQUE INDEX IF NOT EXISTS fixes_unique_t ON telemetry_fixes (session_id, t);

CREATE TABLE IF NOT EXISTS sync_batches (
  idempotency_key TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  fix_count INTEGER NOT NULL,
  ack_status TEXT NOT NULL DEFAULT 'PENDING'
);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("afterflight.db").then(async (db) => {
      await db.execAsync(DDL);
      return db;
    });
  }
  return dbPromise;
}
