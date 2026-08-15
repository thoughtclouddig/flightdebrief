import type { FlightTrackingEventType, LandingState, TrackingSnapshot, TrackingThresholds } from "./types";

export interface LandingStateMachineState {
  state: LandingState;
  /** ISO timestamp of the first snapshot that looked like a landing -- null outside "possible_landing". */
  possibleLandingSince: string | null;
}

export interface LandingTransitionResult {
  state: LandingStateMachineState;
  event: FlightTrackingEventType | null;
}

export function initialLandingState(): LandingStateMachineState {
  return { state: "unknown", possibleLandingSince: null };
}

function looksOnGround(snapshot: TrackingSnapshot, thresholds: TrackingThresholds): boolean {
  return (
    snapshot.groundSpeedKt <= thresholds.groundSpeedThresholdKt &&
    snapshot.distanceFromAirportNm !== null &&
    snapshot.distanceFromAirportNm <= thresholds.airportProximityRadiusNm
  );
}

/**
 * Pure, no I/O -- advances the state machine by one snapshot. `unknown ->
 * airborne -> possible_landing -> on_ground_confirmed`, with
 * `touch_and_go_detected` if speed picks back up before min-time-on-ground
 * elapses (configurable, never hardcoded -- see TrackingThresholds). Does
 * NOT produce "flight_complete" -- that requires detecting the *absence* of
 * further snapshots (engine shutdown stops ADS-B transmission), which this
 * function can't see; see checkFlightComplete below for that half.
 */
export function stepLandingState(
  current: LandingStateMachineState,
  snapshot: TrackingSnapshot,
  thresholds: TrackingThresholds,
): LandingTransitionResult {
  const onGround = looksOnGround(snapshot, thresholds);

  switch (current.state) {
    case "unknown":
      if (onGround) return { state: current, event: null };
      return { state: { state: "airborne", possibleLandingSince: null }, event: "airborne_detected" };

    case "airborne":
      if (!onGround) return { state: current, event: null };
      return {
        state: { state: "possible_landing", possibleLandingSince: snapshot.timestamp },
        event: "landing_detected",
      };

    case "possible_landing": {
      if (!onGround) {
        // Speed picked back up before we confirmed the landing -- a touch-and-go.
        return { state: { state: "airborne", possibleLandingSince: null }, event: "touch_and_go_detected" };
      }
      const elapsedSeconds = (Date.parse(snapshot.timestamp) - Date.parse(current.possibleLandingSince!)) / 1000;
      if (elapsedSeconds >= thresholds.minTimeOnGroundSeconds) {
        return { state: { state: "on_ground_confirmed", possibleLandingSince: null }, event: "ground_confirmed" };
      }
      return { state: current, event: null };
    }

    case "on_ground_confirmed":
    case "flight_complete":
      return { state: current, event: null };
  }
}

/**
 * Called by the (Phase 2) poller when a tail number stops producing new
 * snapshots -- the only reliable "engine off" signal available from ADS-B
 * position data. Reuses minTimeOnGroundSeconds as the silence window so
 * a single threshold covers both "how long stopped counts as landed" and
 * "how long silent counts as fully complete."
 */
export function checkFlightComplete(
  current: LandingStateMachineState,
  lastSnapshotTimestamp: string,
  nowTimestamp: string,
  thresholds: TrackingThresholds,
): LandingTransitionResult {
  if (current.state !== "on_ground_confirmed") return { state: current, event: null };
  const silentSeconds = (Date.parse(nowTimestamp) - Date.parse(lastSnapshotTimestamp)) / 1000;
  if (silentSeconds >= thresholds.minTimeOnGroundSeconds) {
    return { state: { state: "flight_complete", possibleLandingSince: null }, event: "flight_complete" };
  }
  return { state: current, event: null };
}
