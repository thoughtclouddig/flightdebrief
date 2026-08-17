import { skillLabel } from "@/lib/topics";
import type { SkillProgressionStatus, TrainingCategory, TrainingSignal, TrainingSkill } from "@/lib/types";

export interface SkillProgressionHistoryEntry {
  signalId: string;
  flightId: string;
  flightDate: string;
  status: TrainingSignal["status"];
}

export interface SkillProgression {
  skill: TrainingSkill;
  label: string;
  category: TrainingCategory;
  status: SkillProgressionStatus;
  /** Oldest first. */
  history: SkillProgressionHistoryEntry[];
  /** The signal driving the current `status` -- what a CFI's dismiss action targets. */
  latestSignalId: string;
}

/**
 * Derives the V1 5-level skill lifecycle (Introduced/Developing/Needs
 * Coaching/Improving/Demonstrated) from a skill's *sequence* of raw
 * per-flight TrainingSignal statuses -- never stored, since one flight's
 * transcript can only reliably support "came up as a strength" vs. "needs
 * more work," not a 5-way judgment. Conservative by design, same philosophy
 * as lib/training-memory.ts's recurringThemes: it takes more than one flight
 * to call something "Demonstrated."
 *
 * Dismissed signals (see lib/data/types.ts's setTrainingSignalDismissed)
 * should be filtered out by the caller before this runs.
 */
export function computeSkillProgression(signals: TrainingSignal[]): SkillProgression[] {
  const bySkill = new Map<string, TrainingSignal[]>();
  for (const signal of signals) {
    if (!bySkill.has(signal.skill)) bySkill.set(signal.skill, []);
    bySkill.get(signal.skill)!.push(signal);
  }

  const results: SkillProgression[] = [];
  for (const [skill, skillSignals] of bySkill) {
    const ordered = [...skillSignals].sort((a, b) => a.flightDate.localeCompare(b.flightDate));
    const history: SkillProgressionHistoryEntry[] = ordered.map((s) => ({
      signalId: s.id,
      flightId: s.flightId,
      flightDate: s.flightDate,
      status: s.status,
    }));
    results.push({
      skill: skill as TrainingSkill,
      label: skillLabel(skill as TrainingSkill),
      category: ordered[0]!.category,
      status: deriveStatus(ordered),
      history,
      latestSignalId: ordered[ordered.length - 1]!.id,
    });
  }

  return results.sort((a, b) => a.label.localeCompare(b.label));
}

function deriveStatus(orderedSignals: TrainingSignal[]): SkillProgressionStatus {
  const latest = orderedSignals[orderedSignals.length - 1]!;

  if (orderedSignals.length === 1) return "Introduced";
  if (latest.status === "NEEDS_COACHING") return "Needs Coaching";

  // latest is IMPROVING from here down.
  const previous = orderedSignals[orderedSignals.length - 2]!;
  if (previous.status === "NEEDS_COACHING") return "Developing";

  // Three-plus consecutive IMPROVING with no NEEDS_COACHING in between.
  // (Two in a row is still just "Improving" -- with only two raw statuses,
  // a 2-consecutive threshold would make "Improving" unreachable, since any
  // second IMPROVING signal would always jump straight to Demonstrated.)
  let consecutiveImproving = 0;
  for (let i = orderedSignals.length - 1; i >= 0; i--) {
    if (orderedSignals[i]!.status !== "IMPROVING") break;
    consecutiveImproving += 1;
  }
  return consecutiveImproving >= 3 ? "Demonstrated" : "Improving";
}
