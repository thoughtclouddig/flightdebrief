import type { StudentTrainAction, StudentTrainProps, StudentTrainRecommended, StudentTrainSkillRow } from "@/components/student/student-train";
import { RadioPracticeCard, type RadioCardItem } from "@/components/radio-practice-card";
import { acsAreaForSkill } from "@/lib/acs";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus, type SkillProgression } from "@/lib/skill-progress";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { contestedObjective } from "@/lib/chair-fly";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { allTrainingSkills } from "@/lib/topics";
import { performanceLevelLabelFor } from "@/lib/performance-levels";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { formatFlightDate } from "@/lib/utils";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import type { SkillProgressionStatus } from "@/lib/types";

function radioScenarioTitle(scenarioId: string): string {
  return RADIO_PRACTICE_SCENARIOS.find((s) => s.id === scenarioId)?.title ?? "Radio call practice";
}

const STATUS_RANK: Record<SkillProgressionStatus, number> = {
  "Needs Coaching": 0,
  Introduced: 1,
  Developing: 2,
  Improving: 3,
  Demonstrated: 4,
};

/**
 * Real Train -- feeds components/student/student-train.tsx (the approved V2
 * presentation) from real training signals/themes. Extracted verbatim from
 * app/(product)/train/page.tsx's own prior inline logic (no behavior change),
 * shared with app/v2/train/page.tsx's own real-data branch.
 *
 * chairFlyHref/skillHref let each caller supply its own route family; the
 * recommendation/theme/contested-objective computation is identical either
 * way and lives exactly once. Review/Quiz/Ask stay disabled everywhere --
 * no production version exists at all, not a per-mode decision.
 */
export async function buildProductionTrainProps(
  repo: Repository,
  viewer: Viewer,
  hrefs: { chairFlyHref: string; skillHref: (skill: string) => string },
): Promise<StudentTrainProps> {
  const studentId = viewer.user.id;

  const [brief, signals, memberships, radioAssignments] = await Promise.all([
    computeNextLessonBrief(repo, studentId),
    repo.listTrainingSignals({ studentId }),
    repo.listMembershipsForUser(studentId),
    repo.listRadioPracticeAssignments(studentId),
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
  // Only reachable when neither a contested objective nor a recurring theme
  // exists to explain the recommendation -- the weakest-open-skill fallback.
  // Its own supporting quote, when one exists, is the actual TrainingSignal
  // statement that drove that skill's status (see SkillProgression's own
  // latestSignalId doc comment), not a placeholder.
  const weakestSignal = weakest ? (signals.find((s) => s.id === weakest.latestSignalId) ?? null) : null;
  const recommendedSkill = contestedProgression ?? (theme ? (progressions.find((p) => p.skill === theme.skill) ?? null) : weakest);
  const recommendedLabel = contested?.taskLabel ?? theme?.theme ?? recommendedSkill?.label ?? null;
  const recommendedAcsArea = recommendedSkill ? acsAreaForSkill(recommendedSkill.skill, certificateType) : null;

  const recommended: StudentTrainRecommended | null = recommendedLabel
    ? {
        tone: recommendedSkill ? toneForSkillStatus(recommendedSkill.status) : "Improving",
        toneLabel: recommendedSkill ? toneForSkillStatus(recommendedSkill.status) : contested ? "Improving" : "Still building",
        skillLabel: recommendedLabel,
        acsArea: recommendedAcsArea ? { name: recommendedAcsArea.name } : null,
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
        // Omitted entirely, never rendered with empty text -- a recommendation
        // without real supporting evidence is still an honest recommendation
        // (the skill genuinely is the weakest open one), it just doesn't get
        // to claim a quote it doesn't have.
        evidence:
          contested && brief.lastInstructorNote
            ? { label: `${cfi ?? "Your instructor"} · ${formatFlightDate(brief.lastFlight!.flightDate)}`, text: brief.lastInstructorNote.quote }
            : latestLesson
              ? { label: `${latestLesson.instructorName ?? "Your debrief"} · ${formatFlightDate(latestLesson.flightDate)}`, text: latestLesson.statement }
              : weakestSignal
                ? { label: `Your debrief · ${formatFlightDate(weakestSignal.flightDate)}`, text: weakestSignal.statement }
                : null,
      }
    : null;

  const nextLessonDay = brief.upcomingReservation
    ? new Date(brief.upcomingReservation.scheduledStart).toLocaleDateString("en-US", { weekday: "long" })
    : null;
  const primaryAction: StudentTrainAction | undefined =
    contested && hasAuthoredScenario(contested.taskLabel)
      ? {
          label: "Start chair flying",
          href: hrefs.chairFlyHref,
          caption: nextLessonDay ? `About 4 minutes · rehearse it before ${nextLessonDay}` : "About 4 minutes",
        }
      : undefined;

  // Shown whenever there's a recommendation at all, not only when it's a
  // contested objective -- a known gap ("no production Review/Quiz/Ask yet")
  // stays visible as a known gap regardless of which recommendation branch
  // produced the panel above it. Never linked into the prototype's routes.
  const secondaryActions: StudentTrainAction[] | undefined = recommended
    ? [
        { label: "Review", disabled: true },
        { label: "Quiz", disabled: true },
        { label: "Ask", disabled: true },
      ]
    : undefined;

  const radioAssigned: RadioCardItem[] = radioAssignments
    .filter((a) => a.status === "assigned")
    .map((a) => ({ id: a.id, title: radioScenarioTitle(a.scenarioId) }));
  const radioPracticed: RadioCardItem[] = radioAssignments
    .filter((a) => a.status === "completed")
    .map((a) => ({ id: a.id, title: radioScenarioTitle(a.scenarioId), correct: a.correct ?? undefined }));
  // Contextually relevant means "this student actually has radio practice to
  // do or review" -- omitted entirely for a student with none, rather than
  // showing an evergreen empty card on every Train screen.
  const afterHeader =
    radioAssigned.length > 0 || radioPracticed.length > 0 ? (
      <RadioPracticeCard assigned={radioAssigned} practiced={radioPracticed} />
    ) : undefined;

  const stillWorkingOn: StudentTrainSkillRow[] = open.map((p) => ({
    key: p.skill,
    label: p.label,
    state: toneForSkillStatus(p.status),
    score: meterScoreForSkillStatus(p.status),
    max: 4,
    href: hrefs.skillHref(p.skill),
  }));

  return {
    recommended,
    vectorInfo: {
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
    },
    primaryAction,
    secondaryActions,
    afterHeader,
    stillWorkingOn,
  };
}
