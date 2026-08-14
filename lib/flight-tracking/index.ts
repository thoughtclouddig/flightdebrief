import type { FlightTrackingProvider } from "./types";
import { MockFlightTrackingProvider } from "./mock-provider";

export type {
  FlightTrackingEventType,
  FlightTrackingProvider,
  LandingState,
  TrackingSnapshot,
  TrackingThresholds,
} from "./types";
export { DEFAULT_TRACKING_THRESHOLDS } from "./types";
export {
  checkFlightComplete,
  initialLandingState,
  stepLandingState,
  type LandingStateMachineState,
  type LandingTransitionResult,
} from "./landing-state-machine";

let cached: FlightTrackingProvider | null = null;

/**
 * Server-only selector, same shape as lib/flight-data/index.ts. Phase 1 has
 * no real provider yet (post-landing detection needs a poller/cron this repo
 * doesn't have -- see the debrief-redesign plan's Phase 2), so this always
 * returns the mock provider for now; a real provider slots in here later
 * without callers changing.
 */
export function getFlightTrackingProvider(): FlightTrackingProvider {
  if (cached) return cached;
  cached = new MockFlightTrackingProvider();
  return cached;
}
