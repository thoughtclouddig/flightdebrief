import type { TrackPosition } from "@/lib/types";

/**
 * The mobile telemetry ingestion contract.
 *
 * This is the seam between the native recorder and everything AfterFlight
 * already has. Deliberately a versioned boundary rather than the native client
 * calling internal Next.js functions: a phone in a flight bag runs whatever
 * build the student last installed, and an app in the App Store cannot be
 * redeployed in step with the server. The server has to keep honouring
 * whatever the phone was built against.
 *
 * The design constraint that shapes everything here: the phone is offline for
 * the entire flight, then uploads over cellular that comes and goes on the
 * ramp. Every batch will be retried, some will arrive twice, and some will
 * arrive out of order. So the protocol is idempotent by construction rather
 * than by the client promising to behave.
 */

export const MOBILE_API_VERSION = "v1" as const;

/** Where a recorded batch has got to. Mirrors the client's SQLite states. */
export type BatchState = "PENDING" | "SYNCING" | "ACKNOWLEDGED";

/**
 * One fix as the phone recorded it.
 *
 * Raw native field names on purpose. Normalizing on the client would mean the
 * server can never reinterpret old data when the rules improve, and it would
 * throw away the accuracy figures that decide whether a fix may support an
 * instructional claim. `course` is course over ground, never heading; `speed`
 * is metres per second over the ground, never indicated airspeed.
 */
export interface MobileFix {
  /** Milliseconds since the session's t0. */
  t: number;
  lat: number;
  lon: number;
  altitudeM: number | null;
  speedMps: number | null;
  courseDeg: number | null;
  accuracyM: number | null;
  altitudeAccuracyM: number | null;
}

export interface TelemetryBatch {
  /**
   * Stable per batch, generated on the device before the first send attempt.
   * This is what makes a retry safe: the same key is the same batch, however
   * many times the radio drops mid-upload.
   */
  idempotencyKey: string;
  sessionId: string;
  fixes: MobileFix[];
}

/** Device metadata, kept so a later track anomaly can be attributed. */
export interface DeviceInfo {
  platform: "ios" | "android";
  model: string | null;
  appVersion: string;
}

export interface MobileSession {
  id: string;
  userId: string;
  /** Epoch ms, set at the START FLIGHT tap. The canonical session origin. */
  t0: number;
  aircraftTail: string;
  instructorId: string | null;
  device: DeviceInfo;
  fixes: MobileFix[];
  /** Keys already folded in. The whole idempotency guarantee. */
  seenBatchKeys: string[];
  endedAt: number | null;
}

export function createSession(input: {
  id: string;
  userId: string;
  t0: number;
  aircraftTail: string;
  instructorId: string | null;
  device: DeviceInfo;
}): MobileSession {
  return { ...input, fixes: [], seenBatchKeys: [], endedAt: null };
}

export interface IngestResult {
  session: MobileSession;
  /** True when this key had already been folded in. The client can drop it. */
  duplicate: boolean;
  accepted: number;
  state: BatchState;
}

/**
 * Fold a batch in, exactly once.
 *
 * Two separate protections, because they guard different failures. The
 * idempotency key catches a whole batch arriving twice -- the common case,
 * where the upload succeeded but the acknowledgement never made it back. The
 * per-fix `t` dedupe catches overlapping batches, which happen when a client
 * resends from an older checkpoint after a crash.
 *
 * Fixes are sorted by `t` afterwards rather than trusted to arrive in order,
 * because everything downstream -- the scrubber, segmentation, vertical-rate
 * derivation -- assumes a monotonic timeline.
 */
export function ingestBatch(session: MobileSession, batch: TelemetryBatch): IngestResult {
  if (session.seenBatchKeys.includes(batch.idempotencyKey)) {
    return { session, duplicate: true, accepted: 0, state: "ACKNOWLEDGED" };
  }

  const known = new Set(session.fixes.map((f) => f.t));
  const fresh = batch.fixes.filter((f) => !known.has(f.t));
  const fixes = [...session.fixes, ...fresh].sort((a, b) => a.t - b.t);

  return {
    session: { ...session, fixes, seenBatchKeys: [...session.seenBatchKeys, batch.idempotencyKey] },
    duplicate: false,
    accepted: fresh.length,
    state: "ACKNOWLEDGED",
  };
}

/* ------------------------------------------------------------- normalize */

const MPS_TO_KT = 1.94384;
const M_TO_FT = 3.28084;
/** Beyond this the fix cannot support an instructional claim. */
export const POOR_ACCURACY_M = 50;

/**
 * Into the shape the existing Flight and Replay pipeline already consumes.
 *
 * The point of the whole exercise: a phone-recorded flight becomes an ordinary
 * `TrackPosition[]`, so Flight Replay, segmentation, Moments and Compare work
 * on it without a second architecture and without knowing where it came from.
 *
 * Poor fixes are dropped rather than smoothed. A 400-metre fix puts a spurious
 * corner in the track that segmentation would happily read as a manoeuvre, and
 * inventing a plausible position is worse than having fewer of them.
 */
export function toTrackPositions(session: MobileSession): TrackPosition[] {
  return session.fixes
    .filter((f) => f.accuracyM != null && f.accuracyM <= POOR_ACCURACY_M)
    .map((f) => ({
      lat: f.lat,
      lon: f.lon,
      altitudeFt: f.altitudeM == null ? undefined : Math.round(f.altitudeM * M_TO_FT),
      groundSpeedKt: f.speedMps == null ? undefined : Math.round(f.speedMps * MPS_TO_KT),
      timestamp: new Date(session.t0 + f.t).toISOString(),
    }));
}

/**
 * Three durations, kept apart.
 *
 * sessionMs includes preflight, taxi and the minutes the phone recorded while
 * the CFI talked. airborneMs is first movement to last. trackedMs is what
 * feeds Tracked Hours and prefers airborne when it can be determined --
 * collapsing them would inflate a student's hours by however long they sat on
 * the ground, and none of the three is Hobbs or logbook time.
 */
export function durations(session: MobileSession, now = Date.now()) {
  const end = session.endedAt ?? now;
  const sessionMs = Math.max(0, end - session.t0);
  const movingThresholdMps = 5 / MPS_TO_KT;
  const moving = session.fixes.filter(
    (f) => f.speedMps != null && f.speedMps > movingThresholdMps && (f.accuracyM ?? Infinity) <= POOR_ACCURACY_M,
  );
  const airborneMs = moving.length >= 2 ? moving[moving.length - 1]!.t - moving[0]!.t : null;
  return { sessionMs, airborneMs, trackedMs: airborneMs ?? sessionMs };
}

/**
 * What to hand `repo.createFlight` when the session finalizes.
 *
 * `externalProvider` carries PHONE_GPS. Those columns already exist on the
 * flights table and have never had a writer -- this is exactly what they are
 * for, so provenance is preserved without a migration.
 *
 * `fr24FlightId` stays null: a phone-recorded flight was not matched to an
 * ADS-B track, and that null is what makes the map say "logged by hand" rather
 * than "ADS-B was sparse". Enrichment may fill it later, but only into the gap.
 */
export function toCreateFlightInput(session: MobileSession, opts: { aircraftId: string }) {
  const d = durations(session);
  const track = toTrackPositions(session);
  return {
    aircraftId: opts.aircraftId,
    departureAirport: "",
    arrivalAirport: "",
    flightDate: new Date(session.t0).toISOString().slice(0, 10),
    durationMinutes: Math.round(d.trackedMs / 60000),
    instructorId: session.instructorId,
    fr24FlightId: null,
    externalProvider: "PHONE_GPS",
    externalId: session.id,
    track: track.length > 0 ? track : null,
    studentId: session.userId,
  };
}
