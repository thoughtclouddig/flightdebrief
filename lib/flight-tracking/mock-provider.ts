import type { FlightTrackingProvider, TrackingSnapshot } from "./types";
import { hashString } from "@/lib/geo";

const LOCAL_AIRPORTS = ["KFFZ", "KCHD", "KSDL", "KDVT", "KGYR"];
const CLIMB_SECONDS = 120;
const DESCENT_SECONDS = 60;
const CYCLE_SECONDS = CLIMB_SECONDS + DESCENT_SECONDS + 60; // + 60s parked before repeating

/**
 * Deterministic, no-network canned climb -> descend -> land -> park sequence,
 * keyed off wall-clock time since the module loaded (so repeated calls for
 * the same tail number progress naturally) and seeded per tail number so
 * different aircraft don't all report identical positions. Used whenever no
 * real FlightTrackingProvider is configured (there isn't one yet -- see
 * lib/flight-tracking/index.ts). Exercises every landing-state-machine
 * transition (airborne -> possible_landing -> on_ground_confirmed) without
 * any live dependency.
 */
export class MockFlightTrackingProvider implements FlightTrackingProvider {
  readonly name = "mock";
  private readonly startedAt = Date.now();

  async getLatestSnapshot(tailNumber: string): Promise<TrackingSnapshot | null> {
    if (!tailNumber.trim()) return null;

    const seed = hashString(tailNumber.toUpperCase());
    const airport = LOCAL_AIRPORTS[seed % LOCAL_AIRPORTS.length];
    const elapsedSeconds = ((Date.now() - this.startedAt) / 1000 + (seed % CYCLE_SECONDS)) % CYCLE_SECONDS;

    let groundSpeedKt: number;
    let altitudeFt: number;
    let distanceFromAirportNm: number;

    if (elapsedSeconds < CLIMB_SECONDS) {
      const t = elapsedSeconds / CLIMB_SECONDS;
      groundSpeedKt = 90 + t * 20;
      altitudeFt = t * 2500;
      distanceFromAirportNm = t * 8;
    } else if (elapsedSeconds < CLIMB_SECONDS + DESCENT_SECONDS) {
      const t = (elapsedSeconds - CLIMB_SECONDS) / DESCENT_SECONDS;
      groundSpeedKt = 100 - t * 95;
      altitudeFt = 2500 * (1 - t);
      distanceFromAirportNm = 8 * (1 - t);
    } else {
      groundSpeedKt = 0;
      altitudeFt = 0;
      distanceFromAirportNm = 0;
    }

    return {
      providerFlightId: `mock-tracking-${tailNumber.toUpperCase()}`,
      tailNumber: tailNumber.toUpperCase(),
      lat: 33.3 + (seed % 100) / 1000,
      lon: -111.7 + (seed % 100) / 1000,
      altitudeFt: Math.round(altitudeFt),
      groundSpeedKt: Math.round(groundSpeedKt),
      timestamp: new Date().toISOString(),
      nearestAirport: airport,
      distanceFromAirportNm: Math.round(distanceFromAirportNm * 10) / 10,
    };
  }
}
