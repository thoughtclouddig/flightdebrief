import type { Repository } from "@/lib/data/types";
import type { FlightWithRelations, Milestone } from "@/lib/types";

/**
 * Rewards Phase 1: automatic milestone/streak detection. This is the only
 * place milestone rules live -- new automatic rules are additions to
 * AUTOMATIC_RULES below, and future student/CFI-confirmed milestone types
 * (first solo, checkride passed, etc.) reuse the same `milestones` table and
 * Milestone type without any schema change, they just won't come through
 * this evaluator (a confirmation flow writes them directly with a different
 * `source`).
 *
 * Deliberately NOT wired into setFlightDebriefStatus itself -- that stays a
 * dumb status setter. Callers invoke evaluateAndAwardMilestones() explicitly
 * right after a debrief actually reaches "complete", same pattern as
 * lib/training-memory.ts's other post-completion derived data. There are two
 * such call sites today (guided/light finish route, freeform analyze route)
 * because debrief completion itself has two code paths -- see each call
 * site's own comment for why.
 */

const STREAK_THRESHOLDS = [3, 5, 10, 25, 50] as const;
const TOTAL_THRESHOLDS = [5, 10, 25, 50] as const;

/**
 * Consecutive completed-debrief flights counting backward from the most
 * recent flight -- NOT a calendar-day streak. `flightsDescending` must
 * already be sorted newest-first.
 */
export function computeDebriefStreak(flightsDescending: FlightWithRelations[]): number {
  let streak = 0;
  for (const flight of flightsDescending) {
    if (flight.debriefStatus !== "complete") break;
    streak++;
  }
  return streak;
}

/**
 * Total flights with a completed debrief -- this is what "N flights
 * captured" counts (completed debriefs, not just logged flights), matching
 * the Rewards principle of rewarding completed reflection, not just flying.
 */
export function computeTotalCaptured(flights: FlightWithRelations[]): number {
  return flights.filter((f) => f.debriefStatus === "complete").length;
}

interface CandidateMilestone {
  type: string;
  metadata: Record<string, unknown>;
}

/**
 * Pure rule evaluation over a snapshot of a student's flights (any sort
 * order works here; totals/streak are computed fresh). Each rule is an
 * *exact* threshold match, not a range check -- since totals only increase
 * by one flight per evaluation run, "streak === N" / "total === N" fires
 * exactly once by construction, on top of the DB's UNIQUE(student_id, type)
 * backstop for duplicate protection.
 */
function evaluateRules(flights: FlightWithRelations[]): CandidateMilestone[] {
  const descending = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const streak = computeDebriefStreak(descending);
  const totalCaptured = computeTotalCaptured(flights);

  const candidates: CandidateMilestone[] = [];

  if (totalCaptured === 1) {
    candidates.push({ type: "first_debrief", metadata: {} });
  }

  for (const threshold of STREAK_THRESHOLDS) {
    if (streak === threshold) {
      candidates.push({ type: `streak_${threshold}`, metadata: { streakLength: threshold } });
    }
  }

  for (const threshold of TOTAL_THRESHOLDS) {
    if (totalCaptured === threshold) {
      candidates.push({ type: `flights_total_${threshold}`, metadata: { totalFlights: threshold } });
    }
  }

  return candidates;
}

/**
 * Call this right after a debrief genuinely reaches debriefStatus "complete"
 * -- never from a draft, in-progress recording, or partial AI output. Safe
 * to call repeatedly (idempotent via DB unique constraint); returns only the
 * milestones newly awarded on this call, for a future celebration UI to key
 * off of.
 */
export async function evaluateAndAwardMilestones(
  repo: Repository,
  studentId: string,
  triggeringFlightId: string,
): Promise<Milestone[]> {
  const flights = await repo.listFlights({ studentId });
  const candidates = evaluateRules(flights);
  if (candidates.length === 0) return [];

  const awarded = await Promise.all(
    candidates.map((candidate) =>
      repo.createMilestoneIfNew({
        studentId,
        type: candidate.type,
        source: "automatic",
        relatedFlightId: triggeringFlightId,
        metadata: candidate.metadata,
      }),
    ),
  );

  return awarded.filter((m): m is Milestone => m !== null);
}
