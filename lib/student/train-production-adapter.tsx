import type { ReactNode } from "react";
import type {
  StudentTrainOtherUnit,
  StudentTrainProps,
  StudentTrainRadioPractice,
  StudentTrainRecommended,
  StudentTrainSkillRow,
} from "@/components/student/student-train";
import { acsAreaForSkill } from "@/lib/acs";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { performanceLevelLabelFor } from "@/lib/performance-levels";
import { buildTrainingPlan, type TrainingUnit } from "@/lib/student/train-units";
import { resolveVectorStrategy } from "@/lib/student/vector-coaching";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";

/**
 * Real Train -- feeds components/student/student-train.tsx (the approved V2
 * presentation) from this student's own current training plan
 * (lib/student/train-units.ts): each quality-filtered Needs Work item from
 * the latest completed debrief becomes its own Vector training unit. The
 * first (Vector's own pick, using the same urgency ranking Next Flight/
 * Progress already use) renders as the rich "Start here" card; up to two
 * more render as compact "Also train" cards; anything beyond that stays
 * reachable through progressive disclosure rather than being dropped.
 *
 * radioPracticeHref is optional: when the caller omits it (today, only
 * app/v2/train/page.tsx's real-data branch, which has no /v2/practice/[id]
 * counterpart yet), the returned radioPractice prop is null and Train
 * simply doesn't show the section -- an honest omission, not a broken
 * cross-namespace link.
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

  const [memberships, plan] = await Promise.all([
    repo.listMembershipsForUser(studentId),
    buildTrainingPlan(repo, studentId),
  ]);
  const certificateType = memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  /**
   * The real instructor quote, verbatim and attributed, whenever the
   * bounded evidence extractor found one for this unit -- never the
   * generic "{cfi} · {date}" label over the raw debrief sentence when a
   * real quote exists. Falls back to unit.evidence (the same debrief
   * sentence Train has always shown) only when no quote was resolved,
   * exactly the extractor's own honest-null degradation.
   */
  function resolveEvidence(unit: TrainingUnit): { label: string; text: string } {
    if (unit.instructorQuote) {
      return { label: unit.instructorQuote.instructorName, text: unit.instructorQuote.quote };
    }
    return unit.evidence;
  }

  /**
   * "You called this X. {instructor} called it Y." -- built from
   * TrainingUnit.comparison (a real, matched AssessmentDifference; see
   * buildTrainingPlan's own doc comment), never invented when no real
   * per-task rating gap exists for this unit.
   */
  function comparisonLineFor(unit: TrainingUnit): ReactNode | null {
    if (!unit.comparison) return null;
    const studentLabel = performanceLevelLabelFor(unit.comparison.studentLabel, "student");
    const instructorLabel = performanceLevelLabelFor(unit.comparison.instructorLabel, "instructor");
    const cfiName = plan.context?.cfiName ?? "your instructor";
    return (
      <>
        You called this <span className="font-semibold text-panel-foreground">{studentLabel}</span>. {cfiName} called it{" "}
        <span className="font-semibold text-panel-foreground">{instructorLabel}</span>.
      </>
    );
  }

  /**
   * A read-only, non-committing preview of the likely Vector strategy --
   * the exact same resolveVectorStrategy() /train/vector/[itemId] uses,
   * called here with activityEvidence always null (nothing has run yet at
   * Train-render time) purely to decide whether a label can be shown
   * honestly. Never a second resolver, never persisted, and clicking
   * "Train with Vector" re-runs the real resolution independently -- this
   * value never substitutes for it. Null (no label) whenever the mechanism
   * isn't known yet, or the resolved strategy isn't one of the three named
   * treatments (a diagnose-mode radio-practice, a knowledge check, or a
   * transfer are real next steps, just not confident enough to preview).
   */
  function previewTreatmentLabel(unit: TrainingUnit): string | null {
    if (!unit.mechanism) return null;
    const strategy = resolveVectorStrategy({
      skill: unit.skill,
      mechanism: unit.mechanism,
      activityEvidence: null,
      cfiName: plan.context?.cfiName ?? "your instructor",
      fallbackEvidenceText: unit.evidence.text,
    });
    if (strategy.kind === "chair-fly") return "Vector recommends: Chair Flying";
    if (strategy.kind === "radio-practice" && strategy.mode === "train") return "Vector recommends: Radio Practice";
    if (strategy.kind === "coach") return "Vector recommends: A quick knowledge check";
    return null;
  }

  /**
   * The shared fields every deck slide needs -- tone/skill/ACS area/evidence
   * are real for every current-debrief unit, not just the top pick, since
   * every unit gets the same rich card treatment now (see
   * components/student/training-unit-card.tsx).
   */
  function baseCard(unit: TrainingUnit) {
    const acsArea = acsAreaForSkill(unit.skill, certificateType);
    const tone = unit.progressionStatus ? toneForSkillStatus(unit.progressionStatus) : "Improving";
    return {
      tone,
      toneLabel: tone,
      skillLabel: unit.skillLabel,
      acsArea: acsArea ? { name: acsArea.name } : null,
      evidence: resolveEvidence(unit),
      comparisonLine: comparisonLineFor(unit),
      recommendedTreatmentLabel: previewTreatmentLabel(unit),
    };
  }

  function toCard(unit: TrainingUnit): StudentTrainRecommended {
    return {
      ...baseCard(unit),
      startHereEyebrow: "Start here",
      contextLine: plan.context ? `Starting where your last flight ended — ${plan.context.flightDate} with ${plan.context.cfiName}.` : "",
    };
  }

  function toOtherUnit(unit: TrainingUnit): StudentTrainOtherUnit {
    return { ...baseCard(unit), vectorSession: unit.vectorSession };
  }

  const recommended = plan.startHere ? toCard(plan.startHere) : null;
  const vectorSession = plan.startHere?.vectorSession ?? null;
  const alsoTrain = plan.alsoTrain.map(toOtherUnit);
  const moreTrain = plan.more.map(toOtherUnit);

  const stillWorkingOn: StudentTrainSkillRow[] = plan.stillWorkingOn.map((s) => ({
    key: s.skill,
    label: s.skillLabel,
    state: toneForSkillStatus(s.status),
    score: meterScoreForSkillStatus(s.status),
    max: 4,
    href: hrefs.skillHref(s.skill),
  }));

  const radioPractice = hrefs.radioPracticeHref
    ? await buildRadioPracticeProps(repo, studentId, hrefs.radioPracticeHref, plan.startHere?.skill === "RADIO_COMMUNICATIONS")
    : null;

  return {
    recommended,
    vectorInfo: {
      tipLabel: "What Vector can do here",
      tipContent: (
        <span className="flex flex-col gap-2.5">
          <span>
            Vector is your AI flight trainer. It uses your debriefs, instructor feedback, and progress to focus your
            between-flight training on what will help most next.
          </span>
          <span>Training is grounded in your actual flight evidence and trusted aviation sources.</span>
        </span>
      ),
    },
    vectorSession,
    radioPractice,
    sectionTitle: "From your last debrief",
    alsoTrain,
    moreTrain,
    stillWorkingOn,
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
    // training-plan result Train's own top panel already shows, just a
    // one-line pointer toward the one entry point that can act on it.
    contextNote: vectorRecommended ? "Vector noticed radio communications came up in your last debrief." : null,
  };
}
