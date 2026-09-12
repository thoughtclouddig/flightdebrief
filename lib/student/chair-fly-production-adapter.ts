import { findScenario, hasAuthoredScenario, recommendedDrill, type ChairFlyDrill } from "@/lib/prototype/chair-fly";
import { skillForObjective } from "@/lib/prototype/assessment";
import { CONCEPTS, STRUCTURED } from "@/lib/prototype-fixtures/vector-data";
import { contestedObjective } from "@/lib/chair-fly";
import { allTrainingSkills } from "@/lib/topics";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { TrainingSkill } from "@/lib/types";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";

/**
 * Real Chair Flying's one authored drill ("Crosswind Landings" -- see
 * lib/prototype/chair-fly.ts's own doc comment), or null when the student's
 * most recent contested objective has no authored scenario -- a real,
 * correct failure, not a gap to fill with generic content. Shared between
 * app/(product)/train/chair-fly/page.tsx and app/v2/train/chair-fly/page.tsx
 * for the no-specific-unit case (a bare visit to /train/chair-fly).
 */
export async function buildProductionChairFlyDrill(repo: Repository, viewer: Viewer): Promise<ChairFlyDrill | null> {
  const studentId = viewer.user.id;
  const brief = await computeNextLessonBrief(repo, studentId);
  const cfi = resolveCfiFirstName(brief.lastInstructor) ?? "your instructor";

  const lastDebrief = brief.lastFlight ? await repo.getDebriefByFlight(brief.lastFlight.id) : null;
  const contested = contestedObjective(lastDebrief?.structuredResult.assessmentDifferences ?? []);
  if (!contested || !hasAuthoredScenario(contested.taskLabel) || !brief.lastFlight) return null;

  const nextLessonDay = brief.upcomingReservation
    ? new Date(brief.upcomingReservation.scheduledStart).toLocaleDateString("en-US", { weekday: "long" })
    : null;

  return recommendedDrill({
    gap: {
      task: contested.taskLabel,
      studentLevel: contested.studentLevel,
      instructorLevel: contested.instructorLevel,
      studentView: "",
      instructorView: contested.note || `${cfi}'s note from this objective.`,
      takeaway: null,
    },
    instructorFirstName: cfi,
    lastFlightDateLabel: formatFlightDate(brief.lastFlight.flightDate),
    nextLesson: {
      when: nextLessonDay ?? "Your next flight",
      lesson: contested.taskLabel,
      focus: brief.focusAreas[0] ?? contested.taskLabel,
    },
  });
}

/**
 * The drill for one specific Vector training unit (lib/student/train-units.ts)
 * -- framed from whichever real evidence is available:
 *
 *   A. This unit's skill IS the last debrief's contested objective -- use
 *      the real perception-gap comparison (same path as
 *      buildProductionChairFlyDrill above).
 *   B. No dual-assessment comparison exists for this skill (the normal case
 *      for a freeform debrief) -- frame the drill from this unit's own
 *      TrainingItem evidence sentence instead. Never fabricates a
 *      disagreement that didn't happen.
 *
 * Null when the unit's skill has no authored scenario at all -- the caller
 * (lib/student/vector-coaching.ts's rehearsalEngineFor, consulted by
 * resolveVectorStrategy after diagnosis) already checked this before ever
 * offering Chair Fly, so null here would only mean the two have drifted out
 * of sync.
 */
export async function buildChairFlyDrillForUnit(
  repo: Repository,
  viewer: Viewer,
  unit: { skill: TrainingSkill; skillLabel: string; evidence: { label: string; text: string } },
): Promise<ChairFlyDrill | null> {
  if (!hasAuthoredScenario(unit.skillLabel)) return null;

  const studentId = viewer.user.id;
  const brief = await computeNextLessonBrief(repo, studentId);
  const cfi = resolveCfiFirstName(brief.lastInstructor) ?? "your instructor";
  const lastFlightDateLabel = brief.lastFlight ? formatFlightDate(brief.lastFlight.flightDate) : "";
  const nextLessonDay = brief.upcomingReservation
    ? new Date(brief.upcomingReservation.scheduledStart).toLocaleDateString("en-US", { weekday: "long" })
    : null;
  const nextLesson = {
    when: nextLessonDay ?? "Your next flight",
    lesson: unit.skillLabel,
    focus: brief.focusAreas[0] ?? unit.skillLabel,
  };

  const lastDebrief = brief.lastFlight ? await repo.getDebriefByFlight(brief.lastFlight.id) : null;
  const contested = contestedObjective(lastDebrief?.structuredResult.assessmentDifferences ?? []);
  const contestedSkill = contested
    ? allTrainingSkills().find((t) => t.label.toLowerCase() === contested.taskLabel.toLowerCase())?.skill
    : undefined;

  // A. A real rated comparison exists and it's about this exact skill.
  if (contested && contestedSkill === unit.skill) {
    return recommendedDrill({
      gap: {
        task: contested.taskLabel,
        studentLevel: contested.studentLevel,
        instructorLevel: contested.instructorLevel,
        studentView: "",
        instructorView: contested.note || `${cfi}'s note from this objective.`,
        takeaway: null,
      },
      instructorFirstName: cfi,
      lastFlightDateLabel,
      nextLesson,
    });
  }

  // B. No comparison to frame from -- use this unit's own debrief evidence.
  const authored = findScenario(unit.skillLabel);
  if (!authored) return null;
  const matchedSkill = skillForObjective(unit.skillLabel);
  const concept = matchedSkill ? CONCEPTS["crosswind-correction-through-touchdown"] : null;

  return {
    objective: unit.skillLabel,
    skill: matchedSkill?.skill ?? null,
    mode: "guided",
    scenario: authored.scenario,
    reason: {
      // Empty, not fabricated -- ChairFlySession reads this as "no rated
      // comparison" and renders reason.line instead.
      studentLabel: "",
      instructorLabel: "",
      instructorName: cfi,
      date: lastFlightDateLabel,
      evidence: unit.evidence.text,
      line: `${cfi} noted: "${unit.evidence.text}" Rehearse the sequence before your next flight.`,
    },
    steps: authored.steps,
    carryForward: (concept?.nextTime ?? STRUCTURED.cockpitCues.slice(0, 3)).slice(0, 3).map((s) => s.replace(/ -- /g, " — ")),
    guardrail:
      "Rehearsal only. Your checklist, the POH and your instructor are the authority on procedures and numbers for your airplane.",
    estimatedMinutes: Math.max(3, Math.round(authored.steps.length * 0.7)),
    nextFlight: nextLesson,
  };
}
