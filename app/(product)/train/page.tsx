import { StudentTrain, type StudentTrainAction, type StudentTrainRecommended, type StudentTrainSkillRow } from "@/components/student/student-train";
import { acsAreaForSkill } from "@/lib/acs";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus, type SkillProgression } from "@/lib/skill-progress";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { contestedObjective } from "@/lib/chair-fly";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { allTrainingSkills } from "@/lib/topics";
import { performanceLevelLabelFor } from "@/lib/performance-levels";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { formatFlightDate } from "@/lib/utils";
import type { SkillProgressionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_RANK: Record<SkillProgressionStatus, number> = {
  "Needs Coaching": 0,
  Introduced: 1,
  Developing: 2,
  Improving: 3,
  Demonstrated: 4,
};

/**
 * Thin data-fetching wrapper -- all the real panel/skill-list content lives
 * in components/student/student-train.tsx, the same component
 * app/prototype/vector/train/page.tsx renders (its "menu" state) with
 * fixture props.
 *
 * Chair Flying reuses the prototype's own authored route
 * (/prototype/vector/train/chair-fly) rather than a second implementation --
 * same treatment as Home's "Start flight" reusing /prototype/vector/fly.
 * Review/Quiz/Ask stay unwired: in the prototype these are client-state
 * toggles inside that same page, not separate routes, so there is nothing
 * to link to without inventing a destination that doesn't exist.
 */
export default async function TrainPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const [brief, signals, memberships] = await Promise.all([
    computeNextLessonBrief(repo, studentId),
    repo.listTrainingSignals({ studentId }),
    repo.listMembershipsForUser(studentId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;
  const cfi = resolveCfiFirstName(brief.lastInstructor);

  const [lastDebrief, lastFlightTasks] = brief.lastFlight
    ? await Promise.all([repo.getDebriefByFlight(brief.lastFlight.id), repo.listFlightTasks(brief.lastFlight.id)])
    : [null, []];
  const contested = contestedObjective(lastDebrief?.structuredResult.assessmentDifferences ?? []);
  const lessonFocus = deriveLessonFocus(lastFlightTasks);

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const open = progressions.filter((p) => p.status !== "Demonstrated");

  const contestedSkillCode = contested
    ? allTrainingSkills().find((t) => t.label.toLowerCase() === contested.taskLabel.toLowerCase())?.skill
    : undefined;
  const contestedProgression: SkillProgression | null = contestedSkillCode
    ? (progressions.find((p) => p.skill === contestedSkillCode) ?? null)
    : null;

  const theme = brief.recurringThemes[0] ?? null;
  const latestLesson = theme?.lessons[theme.lessons.length - 1] ?? null;
  const weakest = [...open].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])[0] ?? null;
  const recommendedSkill = contestedProgression ?? (theme ? (progressions.find((p) => p.skill === theme.skill) ?? null) : weakest);
  const recommendedLabel = contested?.taskLabel ?? theme?.theme ?? recommendedSkill?.label ?? null;
  const recommendedAcsArea = recommendedSkill ? acsAreaForSkill(recommendedSkill.skill, certificateType) : null;

  const recommended: StudentTrainRecommended | null = recommendedLabel
    ? {
        tone: recommendedSkill ? toneForSkillStatus(recommendedSkill.status) : "Improving",
        toneLabel: recommendedSkill ? toneForSkillStatus(recommendedSkill.status) : contested ? "Improving" : "Still building",
        skillLabel: recommendedLabel,
        acsArea: recommendedAcsArea ? { name: recommendedAcsArea.name } : null,
        // Real lesson focus (from the last flight's real flight_tasks) when
        // one exists -- guided-mode debriefs only. Flight metadata
        // (tail/route/date/duration) never appears here even as a fallback:
        // Vector is speaking about what was trained, not where the airplane
        // went, and a freeform debrief with no flight_tasks genuinely has no
        // lesson title to offer, so the sentence degrades instead of reaching
        // for something else to fill the gap.
        contextLine: !brief.lastFlight
          ? ""
          : lessonFocus
            ? `Starting where your last flight ended — ${lessonFocus}${cfi ? ` with ${cfi}` : ""}.`
            : cfi
              ? `Starting where your last flight ended, with ${cfi}.`
              : "Starting where your last flight ended.",
        comparisonLine: contested ? (
          <>
            You called this <span className="font-semibold text-panel-foreground">{performanceLevelLabelFor(contested.studentLevel, "student")}</span>.{" "}
            {cfi ?? "Your instructor"} called it{" "}
            <span className="font-semibold text-panel-foreground">{performanceLevelLabelFor(contested.instructorLevel, "instructor")}</span>.
          </>
        ) : theme && theme.instructorCount >= 2
            ? `Come up in ${theme.count} of your last ${theme.consideredFlights} debriefs -- across ${theme.instructorCount} instructors.`
            : null,
        evidence:
          contested && brief.lastInstructorNote
            ? { label: `${cfi ?? "Your instructor"} · ${formatFlightDate(brief.lastFlight!.flightDate)}`, text: brief.lastInstructorNote.quote }
            : latestLesson
              ? { label: `${latestLesson.instructorName ?? "Your debrief"} · ${formatFlightDate(latestLesson.flightDate)}`, text: latestLesson.statement }
              : { label: "Your debrief", text: "" },
      }
    : null;

  const nextLessonDay = brief.upcomingReservation
    ? new Date(brief.upcomingReservation.scheduledStart).toLocaleDateString("en-US", { weekday: "long" })
    : null;
  // Chair Flying only has one authored scenario ("Crosswind Landings") --
  // an objective with no entry there has no real drill, and offering the
  // button anyway would be a dead end once tapped. See
  // lib/prototype/chair-fly.ts's own doc comment: this is the correct
  // failure, not a gap to paper over with generic content.
  const primaryAction: StudentTrainAction | undefined =
    contested && hasAuthoredScenario(contested.taskLabel)
      ? {
          label: "Start chair flying",
          href: "/train/chair-fly",
          caption: nextLessonDay ? `About 4 minutes · rehearse it before ${nextLessonDay}` : "About 4 minutes",
        }
      : undefined;

  // Review/Quiz/Ask are client-state toggles inside the prototype's own
  // /prototype/vector/train page (authored crosswind prose, a canned
  // knowledge check, an unauthenticated chat endpoint) -- none of that has a
  // real production version yet, and it's explicitly out of scope for this
  // cutover (see the Review/Quiz/Ask capability-gap report). Shown disabled
  // rather than either omitted or linked into the prototype: a known gap,
  // visibly marked, never a silent cross-link into the fixture demo.
  const secondaryActions: StudentTrainAction[] | undefined = contested
    ? [
        { label: "Review", disabled: true },
        { label: "Quiz", disabled: true },
        { label: "Ask", disabled: true },
      ]
    : undefined;

  const stillWorkingOn: StudentTrainSkillRow[] = open.map((p) => ({
    key: p.skill,
    label: p.label,
    state: toneForSkillStatus(p.status),
    score: meterScoreForSkillStatus(p.status),
    max: 4,
    href: `/progress/${p.skill}`,
  }));

  return (
    <StudentTrain
      recommended={recommended}
      vectorInfo={{
        tipLabel: "What Vector can do here",
        tipContent: (
          <span className="flex flex-col gap-2.5">
            <span>
              <strong className="font-semibold text-foreground">A recommendation</strong> &mdash; the one thing worth
              rehearsing before your next flight, drawn from your own debriefs.
            </span>
            {primaryAction ? (
              <span>
                <strong className="font-semibold text-foreground">Chair flying</strong> &mdash; fly the scenario in
                your head. Vector stops at each decision point and asks what you&rsquo;d do.
              </span>
            ) : null}
          </span>
        ),
      }}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      stillWorkingOn={stillWorkingOn}
    />
  );
}
