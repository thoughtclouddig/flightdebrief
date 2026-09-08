import type { FlightDataProvider } from "./types";
import { FR24Provider } from "./fr24-provider";
import { MockFlightDataProvider } from "./mock-provider";
import { isDevelopment } from "@/lib/env";

export type { FlightCandidate, FlightDataProvider } from "./types";
export { isMockProviderFlightId } from "./mock-provider";

let resolved = false;
let cached: FlightDataProvider | null = null;

/**
 * Server-only. Selects FR24 when FR24_API_KEY is configured -- true in any
 * environment. When it isn't:
 *
 * - Development falls back to MockFlightDataProvider, so the whole "search
 *   by tail -> select -> view track" flow works with zero external keys --
 *   this is the one place mock flight data is allowed to exist at all.
 * - Staging/Production return null instead. A missing external-integration
 *   credential must never cause the app to fabricate flight telemetry for a
 *   real user (see docs/release/STAGING-V2-RELEASE-CANDIDATE-AUDIT.md and
 *   the incident this fixes). Callers treat null exactly like "the provider
 *   is temporarily unavailable" -- an honest empty search result / no track,
 *   the same shape a real FR24 miss already produces, never a fabricated one.
 *
 * Resolved once per server lifetime, including the null case -- re-checking
 * `isDevelopment()`/the env var on every call would be harmless but pointless.
 */
export function getFlightDataProvider(): FlightDataProvider | null {
  if (resolved) return cached;
  resolved = true;

  const apiKey = process.env.FR24_API_KEY;
  if (apiKey) {
    cached = new FR24Provider(apiKey);
    return cached;
  }

  if (isDevelopment()) {
    cached = new MockFlightDataProvider();
    console.log("[FlightData] using MockFlightDataProvider — set FR24_API_KEY to use live FR24 data");
    return cached;
  }

  console.log("[FlightData] FR24_API_KEY not configured -- flight search/track unavailable (no synthetic fallback outside Development)");
  cached = null;
  return cached;
}
