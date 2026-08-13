import type { TrackPosition } from "@/lib/types";

/**
 * A single ADS-B-sourced flight candidate returned by a flight data provider.
 * This is contextual data used to help a pilot identify/visualize a flight --
 * never treated as authoritative training telemetry.
 */
export interface FlightCandidate {
  /** Provider-specific flight id, e.g. an FR24 flight id. */
  providerFlightId: string;
  tailNumber: string;
  aircraftType: string | null;
  callsign: string | null;
  departureAirport: string;
  arrivalAirport: string;
  /** ISO datetime */
  scheduledDeparture: string;
  /** ISO datetime, if known */
  scheduledArrival: string | null;
  durationMinutes: number | null;
}

/**
 * Abstraction over any external flight-data source. FR24 is the first
 * implementation; Windsock, FlightAware, ForeFlight track import, and native
 * GPS recording can all implement this same interface later without the app
 * needing to change.
 */
export interface FlightDataProvider {
  readonly name: string;
  searchFlightsByTailNumber(tailNumber: string): Promise<FlightCandidate[]>;
  getFlight(providerFlightId: string): Promise<FlightCandidate | null>;
  getFlightTrack(providerFlightId: string): Promise<TrackPosition[]>;
}
