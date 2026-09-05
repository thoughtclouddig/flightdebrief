import { hasAuthoredScenario, recommendedDrill, type ChairFlyDrill } from "@/lib/prototype/chair-fly";
import { contestedObjective } from "@/lib/chair-fly";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";

/**
 * Real Chair Flying's one authored drill ("Crosswind Landings" -- see
 * lib/prototype/chair-fly.ts's own doc comment), or null when the student's
 * most recent contested objective has no authored scenario -- a real,
 * correct failure, not a gap to fill with generic content. Shared between
 * app/(product)/train/chair-fly/page.tsx and app/v2/train/chair-fly/page.tsx.
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
