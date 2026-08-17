import type { Flight } from "@/lib/types";

/**
 * Free-usage caps for the two usage-based offers (students: 3 free flights;
 * schools: 25 free debriefs). CFIs are free forever and have no cap -- there
 * is intentionally no entitlement function for them.
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
