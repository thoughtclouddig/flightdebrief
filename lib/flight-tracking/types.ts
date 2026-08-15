/**
 * A single point-in-time ADS-B-style position report for one tail number.
 * Contextual signal for landing detection -- never treated as authoritative
 * training telemetry, same caveat as lib/flight-data/'s FlightCandidate.
 */
export interface TrackingSnapshot {
  providerFlightId: string;
  tailNumber: string;
  lat: number;
  lon: number;
  altitudeFt: number;
  groundSpeedKt: number;
  /** ISO datetime */
  timestamp: string;
  nearestAirport: string | null;
  distanceFromAirportNm: number | null;
}

/**
 * Abstraction over any live-tracking source. Phase 1 ships only the mock
 * provider below -- a real provider (FR24 or otherwise) and the poller that
 * drives it are Phase 2 work, once a live-polling data source is committed
 * to. Deliberately narrower than lib/flight-data/'s FlightDataProvider:
 * landing detection only needs the latest snapshot, not historical search.
 */
export interface FlightTrackingProvider {
  readonly name: string;
  getLatestSnapshot(tailNumber: string): Promise<TrackingSnapshot | null>;
}

/** Mirrors flight_tracking_config's columns -- every threshold is configurable per org/aircraft, never hardcoded. */
export interface TrackingThresholds {
  groundSpeedThresholdKt: number;
  minTimeOnGroundSeconds: number;
  airportProximityRadiusNm: number;
}

export const DEFAULT_TRACKING_THRESHOLDS: TrackingThresholds = {
  groundSpeedThresholdKt: 5,
  minTimeOnGroundSeconds: 180,
  airportProximityRadiusNm: 1.0,
};

export type LandingState = "unknown" | "airborne" | "possible_landing" | "on_ground_confirmed" | "flight_complete";

export type FlightTrackingEventType =
  | "airborne_detected"
  | "landing_detected"
  | "ground_confirmed"
  | "touch_and_go_detected"
  | "flight_complete"
  | "reminder_sent";
