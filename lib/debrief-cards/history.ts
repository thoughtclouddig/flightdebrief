import type { RecentSkillHistoryEntry } from "./generate";
import type { DebriefCard, FlightTask } from "@/lib/types";
import type { Repository } from "@/lib/data/types";

const WEAK_LEVELS = new Set(["NEEDS_COACHING", "LEARNING"]);

/** A task counts as "flagged" on a past flight if either rater called it weak, or the CFI marked it for follow-up. */
function wasFlagged(card: DebriefCard): boolean {
  if (card.flaggedForFollowUp) return true;
  if (card.studentRating && WEAK_LEVELS.has(card.studentRating)) return true;
  if (card.instructorRating && WEAK_LEVELS.has(card.instructorRating)) return true;
  return false;
}

/**
 * Pure aggregation, no DB access -- each element of `perFlightFlaggedTaskCodes`
 * is the set of task codes flagged on one past flight; tallies how many
 * flights flagged each code. Feeds the "previous_flight_issue" tier of
 * generateDebriefCards().
 */
export function aggregateRecentSkillHistory(perFlightFlaggedTaskCodes: string[][]): RecentSkillHistoryEntry[] {
  const consideredFlights = perFlightFlaggedTaskCodes.length;
  const counts = new Map<string, number>();

  for (const codes of perFlightFlaggedTaskCodes) {
    for (const code of new Set(codes)) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([taskCode, flaggedCount]) => ({ taskCode, flaggedCount, consideredFlights }));
}

/** Resolves each flight's flagged cards to their FlightTask.taskCode (cards reference flight_task_id, not the code directly). */
function flaggedTaskCodesFor(cards: DebriefCard[], tasks: FlightTask[]): string[] {
  const taskIdToCode = new Map<string, string>(tasks.map((t) => [t.id, t.taskCode]));
  return cards
    .filter((c) => c.flightTaskId !== null && wasFlagged(c))
    .map((c) => taskIdToCode.get(c.flightTaskId as string))
    .filter((code): code is string => !!code);
}

/**
 * Fetches the student's last `consideredFlights` completed flights before
 * `beforeFlightDate` (excluding `excludeFlightId`) and aggregates which task
 * codes were flagged on each.
 */
export async function computeRecentSkillHistory(
  repo: Repository,
  studentId: string,
  excludeFlightId: string,
  beforeFlightDate: string,
  consideredFlights = 3,
): Promise<RecentSkillHistoryEntry[]> {
  const flights = await repo.listFlights({ studentId });
  const recentFlights = flights
    .filter((f) => f.id !== excludeFlightId && f.debriefStatus === "complete" && f.flightDate <= beforeFlightDate)
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))
    .slice(0, consideredFlights);

  const perFlightFlaggedTaskCodes = await Promise.all(
    recentFlights.map(async (f) => {
      const [cards, tasks] = await Promise.all([repo.listCards(f.id), repo.listFlightTasks(f.id)]);
      return flaggedTaskCodesFor(cards, tasks);
    }),
  );

  return aggregateRecentSkillHistory(perFlightFlaggedTaskCodes);
}
