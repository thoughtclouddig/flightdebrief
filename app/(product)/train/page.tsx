import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import {
  AcsBadge,
  Evidence,
  InfoTip,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PageTitle,
  Screen,
  Section,
  SkillMeter,
  StateLabel,
  VectorMark,
} from "@/components/prototype/ui";
import { stateTone } from "@/lib/prototype/state-tone";
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
 * Train -- Phase 6 exact reproduction of app/prototype/vector/train/page.tsx's
 * structure: PageTitle, a "Today Vector recommends" panel with Vector's
 * identity and a real explanation of what it can do, then the open-skill
 * list with the same meter+link treatment as Progress.
 *
 * The prototype's panel offers Chair Flying or a "5-minute review" as its
 * one primary action. Neither is wired: lib/prototype/chair-fly.ts has one
 * authored scenario keyed to the literal string "Crosswind Landings" against
 * its own fixture, which won't match production's real task labels even
 * when a real contested objective exists; the "5-minute review" content
 * (CONCEPTS/KNOWLEDGE_CHECK) is authored prose with no production library at
 * all. Per "omit the action, don't redesign the page": the panel keeps its
 * exact shape through the evidence quote, and what would have been the
 * action row is the real Recommended Study + Vector guidance immediately
 * below it, in the same position.
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
  const recommendedTone = recommendedSkill ? toneForStatus(recommendedSkill.status) : null;
  const recommendedAcsArea = recommendedSkill ? acsAreaForSkill(recommendedSkill.skill, certificateType) : null;

  const studyReferences = recommendedLabel ? suggestStudyReferences([recommendedLabel]) : [];

  if (!recommendedLabel && studyReferences.length === 0 && !brief.suggestedQuestion) {
    return (
      <Screen>
        <PageTitle>Train</PageTitle>
        <p className="px-1.5 text-[15px] text-foreground-faint">
          Nothing to train on yet -- this fills in once your first debrief is finished.
        </p>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle>Train</PageTitle>

      {recommendedLabel ? (
        <Section title="Today Vector recommends" flush>
          <Panel>
            <div className="flex items-start justify-between gap-2 border-b border-panel-hairline pb-5">
              <VectorMark subtitle="Your AI flight trainer" onPanel />
              <InfoTip label="What Vector can do here" onPanel>
                <span className="flex flex-col gap-2.5">
                  <span>
                    <strong className="font-semibold text-foreground">Recommended study</strong> &mdash; real FAA-
                    sourced references matched to what came up in your debriefs.
                  </span>
                  <span>
                    <strong className="font-semibold text-foreground">A suggested question</strong> &mdash; one
                    concrete thing to ask your instructor next, drawn from your own last debrief.
                  </span>
                </span>
              </InfoTip>
            </div>

            {brief.lastFlight ? (
              <p className="mt-5 text-[15px] leading-relaxed text-panel-foreground-soft">
                Starting where your last flight ended &mdash; {formatFlightContext(brief.lastFlight)}
                {cfi ? ` with ${cfi}` : ""}.
              </p>
            ) : null}

            <div className="mt-6">
              <PanelEyebrow className={recommendedTone ? stateTone(recommendedTone, true).text : undefined}>
                {theme ? "Worth extra focus" : "Still building"}
              </PanelEyebrow>
            </div>
            <PanelHeadline>{recommendedLabel}</PanelHeadline>
            {recommendedSkill && recommendedAcsArea ? (
              <div className="mt-2">
                <AcsBadge area={recommendedAcsArea.name} onPanel />
              </div>
            ) : null}

            {theme && theme.instructorCount >= 2 ? (
              <p className="mt-4 text-[15px] leading-relaxed text-panel-foreground-soft">
                Come up in {theme.count} of your last {theme.consideredFlights} debriefs -- across{" "}
                {theme.instructorCount} instructors.
              </p>
            ) : null}

            {latestLesson ? (
              <div className="mt-5">
                <Evidence
                  label={`${latestLesson.instructorName ?? "Your debrief"} · ${latestLesson.flightDate}`}
                  tone="instructor"
                  text={latestLesson.statement}
                  onPanel
                />
              </div>
            ) : null}
          </Panel>
        </Section>
      ) : null}

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

      {open.length > 0 ? (
        <Section title="Still working on">
          <div className="flex flex-col">
            {open.map((p) => (
              <Link
                key={p.skill}
                href={`/progress/${p.skill}`}
                className="flex min-h-[68px] items-center gap-4 border-b border-hairline py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-medium leading-tight text-foreground">{p.label}</p>
                  <StateLabel state={toneForStatus(p.status)} />
                </div>
                <SkillMeter score={METER_SCORE[p.status]} max={4} state={toneForStatus(p.status)} />
                <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
