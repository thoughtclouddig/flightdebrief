import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { hasAuthoredScenario, recommendedDrill } from "@/lib/prototype/chair-fly";
import { contestedObjective } from "@/lib/chair-fly";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Real Chair Flying -- the same components/student/chair-fly-session.tsx
 * the fixture demo (app/prototype/vector/train/chair-fly) uses, given a
 * real drill instead of the fixture one. Chair Flying's actual authored
 * content (the scene/prompt/options/coaching beats) exists for exactly one
 * objective, "Crosswind Landings" -- see lib/prototype/chair-fly.ts's own
 * doc comment: an objective with no authored scenario has no real drill,
 * which is the correct failure, not a gap to fill with generic content.
 * Train's own CTA already only offers this link when hasAuthoredScenario()
 * is true (see hasAuthoredScenario in app/(product)/train/page.tsx), so a
 * direct hit here with no real drill genuinely has nothing to show.
 */
export default async function TrainChairFlyPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const brief = await computeNextLessonBrief(repo, studentId);
  const cfi = resolveCfiFirstName(brief.lastInstructor) ?? "your instructor";

  const lastDebrief = brief.lastFlight ? await repo.getDebriefByFlight(brief.lastFlight.id) : null;
  const contested = contestedObjective(lastDebrief?.structuredResult.assessmentDifferences ?? []);
  if (!contested || !hasAuthoredScenario(contested.taskLabel) || !brief.lastFlight) notFound();

  const nextLessonDay = brief.upcomingReservation
    ? new Date(brief.upcomingReservation.scheduledStart).toLocaleDateString("en-US", { weekday: "long" })
    : null;

  const drill = recommendedDrill({
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
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href="/train">Train</BackLink>
      <ChairFlySession drill={drill} homeHref="/home" />
    </Screen>
  );
}
