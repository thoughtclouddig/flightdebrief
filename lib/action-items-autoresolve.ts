import { matchSkills } from "@/lib/topics";
import type { Repository } from "@/lib/data/types";

/**
 * After a debrief's structured result is known, checks the student's
 * currently-open action items (from earlier flights) against this
 * flight's `wentWell` content -- if it addresses the same skill an open
 * item flagged, marks that item done. Runs automatically as part of
 * analyzing every debrief; nobody has to remember to prune the list.
 *
 * Deterministic, not AI-judged -- reuses the same keyword/skill matcher
 * already used for training signals (lib/taxonomy.ts's
 * classifyTrainingSignals), same "consistent over clever" philosophy.
 * It reliably catches "these are about the same skill" (e.g. both about
 * approach speed) but can't judge nuance like whether the specific
 * numeric target was actually met -- the student's manual checkbox on
 * /progress stays as the fallback for anything this misses.
 */
export async function autoResolveActionItems(repo: Repository, studentId: string, wentWell: string[]): Promise<void> {
  if (wentWell.length === 0) return;

  const wentWellSkills = new Set(wentWell.flatMap((sentence) => matchSkills(sentence).map((m) => m.skill)));
  if (wentWellSkills.size === 0) return;

  const openItems = (await repo.listTrainingItems({ studentId })).filter((t) => !t.done);

  for (const item of openItems) {
    const itemSkills = matchSkills(item.description).map((m) => m.skill);
    if (itemSkills.some((skill) => wentWellSkills.has(skill))) {
      await repo.setTrainingItemDone(item.id, true);
    }
  }
}
