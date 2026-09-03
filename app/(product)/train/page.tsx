import { ExternalLink } from "lucide-react";
import {
  Evidence,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  PrimaryButton,
  Screen,
  Section,
  VectorMark,
  stateTone,
} from "@/components/prototype/ui";
import { AcsBadge } from "@/components/acs-badge";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression } from "@/lib/skill-progress";
import { suggestStudyReferences } from "@/lib/topics";
import { cn } from "@/lib/utils";
import type { SkillProgressionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function toneForStatus(status: SkillProgressionStatus) {
  if (status === "Demonstrated") return "Meets Standard" as const;
  if (status === "Needs Coaching") return "Needs Work" as const;
  return "Improving" as const;
}

// Worst-first, for picking a fallback when there's no recurring theme.
const STATUS_RANK: Record<SkillProgressionStatus, number> = {
  "Needs Coaching": 0,
  Introduced: 1,
  Developing: 2,
  Improving: 3,
  Demonstrated: 4,
};

/**
 * Between-flights preparation -- the production destination behind the V2
 * nav's Train tab (app/prototype/vector/train/page.tsx is the design source).
 *
 * Deliberately NOT a port of that page's "Today Vector recommends" Panel,
 * which offers Chair Flying or a "5-minute review" as its primary action.
 * Neither has real backing here: lib/prototype/chair-fly.ts's recommendedDrill
 * has exactly one authored scenario, keyed to the literal task label
 * "Crosswind Landings" against lib/prototype/vector-data.ts's fixture --
 * production's real task labels (e.g. "Traffic Pattern & Landings", set by
 * lib/demo/live-demo-seed.ts's TODAY_FLIGHT_TASKS) will not string-match it
 * even when a real contested objective exists, so wiring it would mean
 * matching against arbitrary demo text, not real evidence. The "5-minute
 * review" mode has the same problem one layer up: its content
 * (CONCEPTS/KNOWLEDGE_CHECK) is entirely authored prose with no production
 * equivalent library at all. Neither is faked here. What IS real and shown
 * instead: the recurring theme (or, absent one, the weakest open skill) from
 * computeNextLessonBrief/computeSkillProgression, its own captured evidence
 * sentence, and Recommended Study -- all read from seeded rows or existing
 * production calculations, nothing authored for this page.
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

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const open = progressions.filter((p) => p.status !== "Demonstrated");

  const theme = brief.recurringThemes[0] ?? null;
  const latestLesson = theme?.lessons[theme.lessons.length - 1] ?? null;
  const weakest = [...open].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])[0] ?? null;
  const recommendedSkill = theme ? (progressions.find((p) => p.skill === theme.skill) ?? null) : weakest;
  const recommendedLabel = theme?.theme ?? recommendedSkill?.label ?? null;

  const studyReferences = recommendedLabel ? suggestStudyReferences([recommendedLabel]) : [];

  if (!recommendedLabel && studyReferences.length === 0 && !brief.suggestedQuestion) {
    return (
      <Screen>
        <PanelMeta>Nothing to train on yet -- this fills in once your first debrief is finished.</PanelMeta>
      </Screen>
    );
  }

  return (
    <Screen>
      {recommendedLabel ? (
        <Panel>
          <PanelEyebrow>{theme ? "Worth extra focus" : "Still building"}</PanelEyebrow>
          <PanelHeadline>{recommendedLabel}</PanelHeadline>
          {theme ? (
            <PanelMeta>
              Come up in {theme.count} of your last {theme.consideredFlights} debriefs
              {theme.instructorCount >= 2 ? ` -- across ${theme.instructorCount} instructors` : ""}.
            </PanelMeta>
          ) : recommendedSkill ? (
            <PanelMeta>{recommendedSkill.history.length} {recommendedSkill.history.length === 1 ? "flight" : "flights"} tracked, still short of Meets Standard.</PanelMeta>
          ) : null}
          {latestLesson ? (
            <div className="mt-4">
              <Evidence
                label={latestLesson.instructorName ?? "Your debrief"}
                tone="instructor"
                quoted
                text={latestLesson.statement}
                onPanel
              />
            </div>
          ) : null}
        </Panel>
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
        <Section title="Still working on" flush>
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface px-5">
            {open.map((p) => {
              const tone = stateTone(toneForStatus(p.status));
              return (
                <div key={p.skill} className="flex min-h-[56px] w-full items-center gap-3 border-b border-hairline py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[17px] text-foreground">{p.label}</span>
                      <AcsBadge skill={p.skill} certificateType={certificateType} />
                    </div>
                  </div>
                  <span className={cn("shrink-0 text-[14px] font-medium", tone.text)}>{p.status}</span>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      <PrimaryButton href="/progress">See full progress</PrimaryButton>
    </Screen>
  );
}
