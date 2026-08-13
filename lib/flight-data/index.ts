import type { FlightDataProvider } from "./types";
import { FR24Provider } from "./fr24-provider";
import { MockFlightDataProvider } from "./mock-provider";

export type { FlightCandidate, FlightDataProvider } from "./types";

let cached: FlightDataProvider | null = null;

/** Server-only: selects FR24 when configured, otherwise the mock provider. */
export function getFlightDataProvider(): FlightDataProvider {
  if (cached) return cached;
  const apiKey = process.env.FR24_API_KEY;
  cached = apiKey ? new FR24Provider(apiKey) : new MockFlightDataProvider();
  if (cached.name === "mock") {
    console.log("[FlightData] using MockFlightDataProvider — set FR24_API_KEY to use live FR24 data");
  }
  return cached;
}
