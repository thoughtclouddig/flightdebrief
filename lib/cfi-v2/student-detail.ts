import { computeNextLessonBrief, recommendedStartingPoint, type NextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression, type SkillProgression } from "@/lib/skill-progress";
import { buildPerceptionGapRow, type PerceptionGapRow } from "@/lib/perception-gap";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type {
  Aircraft,
  CertificateType,
  FlightWithRelations,
  RadioPracticeAssignment,
  StructuredDebrief,
  StudentNote,
  User,
} from "@/lib/types";

export interface CfiV2TimelineEntry {
  flight: FlightWithRelations;
  topics: string[];
}

export interface CfiV2StudentDetail {
  student: User;
  certificateType: CertificateType | null;
  brief: NextLessonBrief;
  cfiFirstName: string;
  flyingWithDifferentInstructor: boolean;
  startingPoint: string | null;
  lastDebriefResult: StructuredDebrief | null;
  perceptionGaps: PerceptionGapRow[];
  skillProgressions: SkillProgression[];
  timeline: CfiV2TimelineEntry[];
  canSchedule: boolean;
  instructors: { id: string; name: string }[];
  defaultInstructorId: string | undefined;
  aircraft: Aircraft[];
  scheduleCaption: string | undefined;
  radioPracticeAssignments: RadioPracticeAssignment[];
  suggestedRadioScenarioId: string | null;
  studentNotes: StudentNote[];
}

const RADIO_SUGGESTION_SKILLS = new Set(["RADIO_COMMUNICATIONS", "TOWER_READBACKS"]);

/**
 * Everything CFI V2's Student Detail screen needs, in one call -- merges
 * what V1 split across app/(product)/cfi/students/[id]/page.tsx (tabbed
 * profile) and app/(product)/cfi/students/[id]/handoff/page.tsx (the
 * pre-flight brief), both of which independently called
 * computeNextLessonBrief for the same student. V2 folds Handoff's content
 * directly into Student Detail (see the approved Next Flight/Current Focus
 * hierarchy) instead of requiring a second click and a second fetch.
 */
export async function computeCfiV2StudentDetail(
  repo: Repository,
  viewer: Viewer,
  studentId: string,
): Promise<CfiV2StudentDetail | null> {
  const student = await repo.getUser(studentId);
  if (!student) return null;

  const memberships = await repo.listMembershipsForUser(studentId);
  const inOrg = memberships.some((m) => m.organizationId === viewer.organization.id);
  if (!inOrg) return null;

  const isCfiOrAdmin = viewer.role === "instructor" || viewer.role === "admin";
  const canSchedule = isCfiOrAdmin;

  const [flights, signals, brief, radioPracticeAssignments, studentNotes, aircraft, orgInstructorMembers, instructorLinks] =
    await Promise.all([
      repo.listFlights({ studentId }),
      repo.listTrainingSignals({ studentId }),
      computeNextLessonBrief(repo, studentId),
      repo.listRadioPracticeAssignments(studentId),
      isCfiOrAdmin ? repo.listStudentNotes({ studentId }) : Promise.resolve([]),
      canSchedule ? repo.listAircraft(viewer.organization.id) : Promise.resolve([]),
      canSchedule ? repo.listMembers(viewer.organization.id, "instructor") : Promise.resolve([]),
      canSchedule ? repo.listInstructorLinksForStudent(studentId) : Promise.resolve([]),
    ]);

  const instructors = (
    await Promise.all(orgInstructorMembers.filter((m) => m.status === "active").map((m) => repo.getUser(m.userId)))
  )
    .filter((u): u is User => u !== null)
    .map((u) => ({ id: u.id, name: u.name }));
  const defaultInstructorId =
    instructorLinks.find((l) => l.isPrimary && l.status === "active")?.instructorId ??
    instructorLinks.find((l) => l.status === "active")?.instructorId;

  const certificateType = memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  const debriefedFlights = [...flights]
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const timeline: CfiV2TimelineEntry[] = await Promise.all(
    debriefedFlights.map(async (flight) => {
      const debrief = await repo.getDebriefByFlight(flight.id);
      return { flight, topics: debrief?.structuredResult.whatWeDid ?? [] };
    }),
  );

  const lastDebriefResult = brief.lastDebrief?.structuredResult ?? null;
  const perceptionGaps = (lastDebriefResult?.assessmentDifferences ?? [])
    .map((d) =>
      buildPerceptionGapRow({
        taskLabel: d.taskLabel,
        studentLevel: d.studentLevel,
        instructorLevel: d.instructorLevel,
        status: discrepancyStatusFor(discrepancyDistance(d.studentLevel, d.instructorLevel)),
        note: d.note,
      }),
    )
    .filter((r) => r.status !== "none");

  const skillProgressions = computeSkillProgression(signals.filter((s) => !s.dismissed));

  const assignedScenarioIds = new Set(radioPracticeAssignments.map((a) => a.scenarioId));
  const suggestedRadioScenarioId =
    skillProgressions
      .filter((p) => RADIO_SUGGESTION_SKILLS.has(p.skill) && p.status === "Needs Coaching")
      .map((p) => RADIO_PRACTICE_SCENARIOS.find((s) => s.skill === p.skill && !assignedScenarioIds.has(s.id)))
      .find((s): s is (typeof RADIO_PRACTICE_SCENARIOS)[number] => s !== undefined)?.id ?? null;

  return {
    student,
    certificateType,
    brief,
    cfiFirstName: resolveCfiFirstName(brief.lastInstructor) ?? "your instructor",
    flyingWithDifferentInstructor: Boolean(brief.lastInstructor) && brief.lastInstructor?.id !== viewer.user.id,
    startingPoint: recommendedStartingPoint(brief),
    lastDebriefResult,
    perceptionGaps,
    skillProgressions,
    timeline,
    canSchedule,
    instructors,
    defaultInstructorId,
    aircraft,
    scheduleCaption:
      viewer.organization.kind === "school" ? "For your own planning -- this doesn't sync with Flight Schedule Pro." : undefined,
    radioPracticeAssignments,
    suggestedRadioScenarioId,
    studentNotes,
  };
}
