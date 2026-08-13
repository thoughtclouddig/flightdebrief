import type { SchedulingProvider } from "./types";
import { MockSchedulingProvider } from "./mock-provider";

export type { SchedulingProvider } from "./types";

let cached: SchedulingProvider | null = null;

/**
 * Server-only. Selects a real scheduling integration (e.g. Flight Schedule
 * Pro) when configured, otherwise the mock provider. No real provider is
 * implemented yet -- FLIGHT_SCHEDULE_PRO_API_KEY is reserved for when one is.
 */
export function getSchedulingProvider(): SchedulingProvider {
  if (cached) return cached;
  const apiKey = process.env.FLIGHT_SCHEDULE_PRO_API_KEY;
  if (apiKey) {
    throw new Error("FlightScheduleProProvider is not implemented yet -- unset FLIGHT_SCHEDULE_PRO_API_KEY to use the mock provider.");
  }
  cached = new MockSchedulingProvider();
  console.log("[Scheduling] using MockSchedulingProvider — no real scheduling integration configured");
  return cached;
}
