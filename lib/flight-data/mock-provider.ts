import type { FlightCandidate, FlightDataProvider } from "./types";
import type { TrackPosition } from "@/lib/types";
import { generatePatternTrack, hashString } from "@/lib/geo";

const LOCAL_AIRPORTS = ["KFFZ", "KCHD", "KSDL", "KDVT", "KGYR"];

function candidatesForTail(tailNumber: string): FlightCandidate[] {
  const seed = hashString(tailNumber.toUpperCase());
  const now = new Date();
  const candidates: FlightCandidate[] = [];

  for (let i = 0; i < 3; i++) {
    const daysAgo = i * 2 + (seed % 3);
    const depTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    depTime.setHours(9 + ((seed + i) % 6), 0, 0, 0);
    const departure = LOCAL_AIRPORTS[(seed + i) % LOCAL_AIRPORTS.length];
    const isLocal = (seed + i) % 3 !== 0;
    const arrival = isLocal ? departure : LOCAL_AIRPORTS[(seed + i + 1) % LOCAL_AIRPORTS.length];
    const durationMinutes = 55 + ((seed + i * 7) % 50);

    candidates.push({
      providerFlightId: `mock-${tailNumber.toUpperCase()}-${i}`,
      tailNumber: tailNumber.toUpperCase(),
      aircraftType: "DA40",
      callsign: `N${tailNumber.replace(/[^0-9A-Z]/gi, "").slice(-3)}`,
      departureAirport: departure,
      arrivalAirport: arrival,
      scheduledDeparture: depTime.toISOString(),
      scheduledArrival: new Date(depTime.getTime() + durationMinutes * 60 * 1000).toISOString(),
      durationMinutes,
    });
  }

  return candidates;
}

/** Every id this provider hands out -- see candidatesForTail() below. */
export function isMockProviderFlightId(providerFlightId: string): boolean {
  return providerFlightId.startsWith("mock-");
}

/**
 * Deterministic, no-network flight data source used in Development whenever
 * FR24_API_KEY is not configured (see lib/flight-data/index.ts -- this
 * provider is never selected in Staging/Production regardless of the key).
 * Produces believable candidate flights and pattern tracks so the whole
 * "search by tail number -> select -> view track" flow works out of the box.
 */
export class MockFlightDataProvider implements FlightDataProvider {
  readonly name = "mock";

  async searchFlightsByTailNumber(tailNumber: string): Promise<FlightCandidate[]> {
    if (!tailNumber.trim()) return [];
    return candidatesForTail(tailNumber);
  }

  async getFlight(providerFlightId: string): Promise<FlightCandidate | null> {
    const match = providerFlightId.match(/^mock-(.+)-(\d+)$/);
    if (!match) return null;
    const [, tail] = match;
    const candidates = candidatesForTail(tail);
    return candidates.find((c) => c.providerFlightId === providerFlightId) ?? null;
  }

  async getFlightTrack(providerFlightId: string): Promise<TrackPosition[]> {
    const candidate = await this.getFlight(providerFlightId);
    if (!candidate) return [];
    return generatePatternTrack(candidate.departureAirport, {
      startTime: new Date(candidate.scheduledDeparture),
      durationMinutes: candidate.durationMinutes ?? 75,
      seed: hashString(providerFlightId),
    });
  }
}
