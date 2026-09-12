import type { StudentTrainProps, StudentTrainRadioPractice, StudentTrainRecommended } from "@/components/student/student-train";
import { acsAreaForSkill } from "@/lib/acs";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { computeNextLessonBrief, computeRecommendedFocus } from "@/lib/training-memory";
import { toneForSkillStatus } from "@/lib/skill-progress";
import { buildVectorSession } from "@/lib/student/vector-coaching";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { performanceLevelLabelFor } from "@/lib/performance-levels";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { formatFlightDate } from "@/lib/utils";

/**
 * Real Train -- feeds components/student/student-train.tsx (the approved V2
 * presentation) from real training signals/themes. Extracted verbatim from
 * app/(product)/train/page.tsx's own prior inline logic (no behavior change),
 * shared with app/v2/train/page.tsx's own real-data branch.
 *
 * The recommendation ranking itself (contested objective -> recurring theme
 * -> weakest open skill) now lives in lib/training-memory.ts's
 * computeRecommendedFocus, shared verbatim with Next Flight -- this adapter
 * only adds the display formatting (tone, ACS area, comparison sentence)
 * computeRecommendedFocus deliberately leaves out.
 *
 * radioPracticeHref is optional: when the caller omits it (today, only
 * app/v2/train/page.tsx's real-data branch, which has no /v2/practice/[id]
 * counterpart yet), the returned radioPractice prop is null and Train
 * simply doesn't show the section -- an honest omission, not a broken
 * cross-namespace link. chairFlyHref/skillHref stay required since both
 * namespaces already have real routes for them.
 *
 * Review/Quiz/Ask stay disabled everywhere -- no production version exists
 * at all, not a per-mode decision.
 */
export async function buildProductionTrainProps(
  repo: Repository,
  viewer: Viewer,
  hrefs: { chairFlyHref: string; skillHref: (skill: string) => string; radioPracticeHref?: string },
): Promise<StudentTrainProps> {
  const studentId = viewer.user.id;

  const [brief, memberships] = await Promise.all([
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;
  const cfi = resolveCfiFirstName(brief.lastInstructor);

  const [lastFlightTasks, focus] = await Promise.all([
    brief.lastFlight ? repo.listFlightTasks(brief.lastFlight.id) : Promise.resolve([]),
    computeRecommendedFocus(repo, brief),
  ]);
  const { skillProgression: recommendedSkill, label: recommendedLabel, contested, theme, resolvedSkill } = focus;
  const lessonFocus = deriveLessonFocus(lastFlightTasks);
  const latestLesson = theme?.lessons[theme.lessons.length - 1] ?? null;
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

  const vectorSession = buildVectorSession({
    resolvedSkill,
    contested,
    hrefs: { chairFlyHref: hrefs.chairFlyHref, radioPracticeHref: hrefs.radioPracticeHref },
    nextLessonDay,
  });

  const radioPractice = hrefs.radioPracticeHref
    ? await buildRadioPracticeProps(repo, studentId, hrefs.radioPracticeHref, resolvedSkill === "RADIO_COMMUNICATIONS")
    : null;

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
          {vectorSession.action?.kind === "chair-fly" ? (
            <span>
              <strong className="font-semibold text-foreground">Chair flying</strong> &mdash; fly the scenario in
              your head. Vector stops at each decision point and asks what you&rsquo;d do.
            </span>
          ) : vectorSession.action?.kind === "radio-practice" ? (
            <span>
              <strong className="font-semibold text-foreground">Radio Practice</strong> &mdash; realistic ATC
              scenarios, graded on what you actually said.
            </span>
          ) : (
            <span>
              <strong className="font-semibold text-foreground">Grounded coaching</strong> &mdash; what to prepare and
              watch for, drawn from FAA reference material, not invented on the spot.
            </span>
          )}
        </span>
      ),
    },
    vectorSession,
    radioPractice,
  };
}

async function buildRadioPracticeProps(
  repo: Repository,
  studentId: string,
  startHref: string,
  vectorRecommended: boolean,
): Promise<StudentTrainRadioPractice> {
  const assignments = await repo.listRadioPracticeAssignments(studentId);
  const pending = assignments
    .filter((a) => a.assignedBy !== null && a.status !== "completed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  let cfiRecommendation: StudentTrainRadioPractice["cfiRecommendation"] = null;
  if (pending) {
    const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.id === pending.scenarioId);
    const assigner = await repo.getUser(pending.assignedBy!);
    if (scenario && assigner) {
      cfiRecommendation = {
        instructorFirstName: assigner.name.split(" ")[0] ?? assigner.name,
        scenarioTitle: scenario.title,
        href: `/practice/${pending.id}`,
      };
    }
  }

  return {
    startHref,
    cfiRecommendation,
    // Never a second recommendation system -- this is the same
    // computeRecommendedFocus result Train's own top panel already shows,
    // just a one-line pointer toward the one entry point that can act on it.
    contextNote: vectorRecommended ? "Vector noticed radio communications came up in your last debrief." : null,
  };
}
