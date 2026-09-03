import { notFound } from "next/navigation";
import { AcsBadge } from "@/components/acs-badge";
import { BackLink, Evidence, PageTitle, Screen, Section, TrendStrip } from "@/components/prototype/ui";
import { stateTone } from "@/lib/prototype/state-tone";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeSkillProgression } from "@/lib/skill-progress";
import { cn } from "@/lib/utils";
import type { SkillProgressionStatus, TrainingSkill } from "@/lib/types";

export const dynamic = "force-dynamic";

function toneForStatus(status: SkillProgressionStatus) {
  if (status === "Demonstrated") return "Meets Standard" as const;
  if (status === "Needs Coaching") return "Needs Work" as const;
  return "Improving" as const;
}

/**
 * Per-skill drill-down -- app/prototype/vector/progress/[skill]/page.tsx is
 * the design source, and it turned out to be truthfully buildable: every
 * field it needs (a dated trend, a real quoted statement per data point,
 * ACS attribution) already exists on production's TrainingSignal rows
 * (lib/types.ts) and computeSkillProgression's history (lib/skill-progress.ts) --
 * nothing here is fixture-backed. The one prototype feature NOT ported is
 * objectiveForSkill's perception-gap cross-reference
 * (lib/prototype/assessment.ts): production computes a perception gap per
 * FLIGHT (lib/perception-gap.ts, on the debrief itself), not aggregated per
 * skill across flights, so there's no real per-skill "how you both saw it"
 * to show here without inventing an aggregation that doesn't exist yet.
 */
export default async function SkillDetailPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: skillParam } = await params;
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const [signals, memberships] = await Promise.all([
    repo.listTrainingSignals({ studentId }),
    repo.listMembershipsForUser(studentId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const progression = progressions.find((p) => p.skill === (skillParam as TrainingSkill));
  if (!progression) notFound();

  const skillSignals = signals
    .filter((s) => s.skill === progression.skill && !s.dismissed)
    .sort((a, b) => a.flightDate.localeCompare(b.flightDate));

  const trendPoints = skillSignals.slice(-6).map((s) => ({
    label: new Date(s.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: 1,
    max: 1,
    state: s.status === "NEEDS_COACHING" ? ("Needs Work" as const) : ("Improving" as const),
  }));

  const tone = stateTone(toneForStatus(progression.status));

  return (
    <Screen>
      <BackLink href="/progress">Progress</BackLink>
      <PageTitle>{progression.label}</PageTitle>
      <div className="-mt-4 flex items-center gap-2 px-1.5">
        <span className={cn("text-[15px] font-medium", tone.text)}>{progression.status}</span>
        <AcsBadge skill={progression.skill} certificateType={certificateType} />
      </div>

      {trendPoints.length > 1 ? (
        <Section title="Trend">
          <TrendStrip points={trendPoints} />
        </Section>
      ) : null}

      <Section title="What was said, flight by flight" flush>
        <div className="flex flex-col gap-4">
          {[...skillSignals].reverse().map((s) => (
            <Evidence
              key={s.id}
              label={new Date(s.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              tone="neutral"
              quoted
              text={s.statement}
            />
          ))}
        </div>
      </Section>
    </Screen>
  );
}
