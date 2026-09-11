import type { Flight } from "@/lib/types";

/**
 * Free-usage cap for the one remaining usage-based offer: students get 3
 * free flights. Schools no longer have a cap -- they're free forever, same
 * as independent CFIs, as the incentive for a Part 61 school to put
 * AfterFlight in front of its students at all (see isBillingBlocked's own
 * comment). computeSchoolFreeDebriefs stays below for the handful of
 * display-only call sites that still read it (harmless once
 * isBillingBlocked/showFreeUsage stop rendering it for a school org), but
 * it is no longer what gates anything.
 */
export interface FreeUsageStatus {
  used: number;
  cap: number;
  remaining: number;
  exhausted: boolean;
}

/**
 * Computed at read time from already-fetched flights, never stored --
 * matches this codebase's existing pattern (see computeSkillProgression).
 * A flight only counts once its debrief is `"complete"`, so opened,
 * abandoned, or in-progress recordings never consume the allowance.
 */
function computeFreeUsage(flights: Pick<Flight, "debriefStatus">[], cap: number): FreeUsageStatus {
  const used = flights.filter((f) => f.debriefStatus === "complete").length;
  const remaining = Math.max(0, cap - used);
  return { used, cap, remaining, exhausted: used >= cap };
}

/** Student offer: first 3 completed flight debriefs are free. */
export function computeStudentFreeFlights(flights: Pick<Flight, "debriefStatus">[]): FreeUsageStatus {
  return computeFreeUsage(flights, 3);
}

/** School offer: first 25 completed debriefs across the org are free. */
export function computeSchoolFreeDebriefs(flights: Pick<Flight, "debriefStatus">[]): FreeUsageStatus {
  return computeFreeUsage(flights, 25);
}
