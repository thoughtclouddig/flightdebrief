import { ExternalLink } from "lucide-react";
import { Section, VectorMark } from "@/components/prototype/ui";
import { StudentTrain, type StudentTrainRecommended, type StudentTrainSkillRow } from "@/components/prototype/student-train";
import { acsAreaForSkill } from "@/lib/acs";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression } from "@/lib/skill-progress";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { suggestStudyReferences } from "@/lib/topics";
import { formatFlightContext } from "@/lib/utils";
import type { SkillProgressionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function toneForStatus(status: SkillProgressionStatus) {
  if (status === "Demonstrated") return "Meets Standard" as const;
  if (status === "Needs Coaching") return "Needs Work" as const;
  return "Improving" as const;
}

const STATUS_RANK: Record<SkillProgressionStatus, number> = {
  "Needs Coaching": 0,
  Introduced: 1,
  Developing: 2,
  Improving: 3,
  Demonstrated: 4,
};

// Rank onto the same 1-4 scale SkillMeter expects everywhere else -- see
// progress/[skill]/page.tsx's identical mapping. Not a new scoring system:
// this is a display-only bucketing of the same computed status.
const METER_SCORE: Record<SkillProgressionStatus, number> = {
  Introduced: 1,
  "Needs Coaching": 1,
  Developing: 2,
  Improving: 3,
  Demonstrated: 4,
};

/**
 * Thin data-fetching wrapper -- all the real panel/skill-list content lives
 * in components/prototype/student-train.tsx, the same component
 * app/prototype/vector/train/page.tsx renders (its "menu" state) with
 * fixture props. Chair Flying and the 5-minute-review action, Quiz, and Ask
 * are not passed here at all: neither has real backing (chair-fly.ts's one
 * authored scenario is keyed to a literal fixture string that won't match
 * real task labels; CONCEPTS/KNOWLEDGE_CHECK is authored prose with no
 * production library). Recommended Study and Vector guidance -- both real --
 * occupy the position that action would have, via afterHeader.
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

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const open = progressions.filter((p) => p.status !== "Demonstrated");

  const theme = brief.recurringThemes[0] ?? null;
  const latestLesson = theme?.lessons[theme.lessons.length - 1] ?? null;
  const weakest = [...open].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])[0] ?? null;
  const recommendedSkill = theme ? (progressions.find((p) => p.skill === theme.skill) ?? null) : weakest;
  const recommendedLabel = theme?.theme ?? recommendedSkill?.label ?? null;
  const recommendedAcsArea = recommendedSkill ? acsAreaForSkill(recommendedSkill.skill, certificateType) : null;

  const studyReferences = recommendedLabel ? suggestStudyReferences([recommendedLabel]) : [];

  const recommended: StudentTrainRecommended | null = recommendedLabel
    ? {
        tone: recommendedSkill ? toneForStatus(recommendedSkill.status) : "Improving",
        toneLabel: theme ? "Worth extra focus" : "Still building",
        skillLabel: recommendedLabel,
        acsArea: recommendedAcsArea ? { name: recommendedAcsArea.name } : null,
        contextLine: brief.lastFlight
          ? `Starting where your last flight ended -- ${formatFlightContext(brief.lastFlight)}${cfi ? ` with ${cfi}` : ""}.`
          : "",
        comparisonLine:
          theme && theme.instructorCount >= 2
            ? `Come up in ${theme.count} of your last ${theme.consideredFlights} debriefs -- across ${theme.instructorCount} instructors.`
            : null,
        evidence: latestLesson
          ? { label: `${latestLesson.instructorName ?? "Your debrief"} · ${latestLesson.flightDate}`, text: latestLesson.statement }
          : { label: "Your debrief", text: "" },
      }
    : null;

  const stillWorkingOn: StudentTrainSkillRow[] = open.map((p) => ({
    key: p.skill,
    label: p.label,
    state: toneForStatus(p.status),
    score: METER_SCORE[p.status],
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
              <strong className="font-semibold text-foreground">Recommended study</strong> &mdash; real FAA-sourced
              references matched to what came up in your debriefs.
            </span>
            <span>
              <strong className="font-semibold text-foreground">A suggested question</strong> &mdash; one concrete
              thing to ask your instructor next, drawn from your own last debrief.
            </span>
          </span>
        ),
      }}
      afterHeader={
        <>
          {studyReferences.length > 0 ? (
            <Section title="Recommended study">
              <ul className="flex flex-col gap-4">
                {studyReferences.map((ref, i) => (
                  <li key={i} className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">{ref.topic}</span>
                    {ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1 text-[15px] text-brand hover:underline"
                      >
                        {ref.source}
                        <ExternalLink className="size-3 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-[15px] text-foreground-soft">{ref.source}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {brief.suggestedQuestion ? (
            <Section title="Vector guidance" flush>
              <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
                <VectorMark subtitle="Suggested by Vector" />
                <p className="mt-3 text-[17px] text-foreground">&ldquo;{brief.suggestedQuestion}&rdquo;</p>
              </div>
            </Section>
          ) : null}
        </>
      }
      stillWorkingOn={stillWorkingOn}
    />
  );
}
