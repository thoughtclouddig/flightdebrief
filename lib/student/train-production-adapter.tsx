import type {
  StudentTrainCompactUnit,
  StudentTrainProps,
  StudentTrainRadioPractice,
  StudentTrainRecommended,
} from "@/components/student/student-train";
import { acsAreaForSkill } from "@/lib/acs";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { toneForSkillStatus } from "@/lib/skill-progress";
import { buildTrainingPlan, type TrainingUnit } from "@/lib/student/train-units";
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

  function toCard(unit: TrainingUnit): StudentTrainRecommended {
    const acsArea = acsAreaForSkill(unit.skill, certificateType);
    const tone = unit.progressionStatus ? toneForSkillStatus(unit.progressionStatus) : "Improving";
    return {
      tone,
      toneLabel: tone,
      startHereEyebrow: "Start here",
      skillLabel: unit.skillLabel,
      acsArea: acsArea ? { name: acsArea.name } : null,
      contextLine: "",
      comparisonLine: null,
      evidence: unit.evidence,
    };
  }

  function toCompact(unit: TrainingUnit): StudentTrainCompactUnit {
    return { skillLabel: unit.skillLabel, evidence: unit.evidence, vectorSession: unit.vectorSession };
  }

  const recommended = plan.startHere ? toCard(plan.startHere) : null;
  const vectorSession = plan.startHere?.vectorSession ?? null;
  const alsoTrain = plan.alsoTrain.map(toCompact);
  const moreTrain = plan.more.map(toCompact);

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
