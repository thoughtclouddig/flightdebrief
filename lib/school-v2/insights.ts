import { mostCommonIssues, recurringStudentIssues, trainingCoverage, type RecurringStudentIssue } from "@/lib/training-insights";
import { computeContinuityForRoster, type SchoolContinuityItem } from "@/lib/school-v2/continuity";
import { schoolAttentionFromRoster, type SchoolAttentionItem } from "@/lib/school-v2/overview";
import { computeSchoolV2Roster, type SchoolV2RosterEntry } from "@/lib/school-v2/roster";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { TrainingCategory, TrainingSkill } from "@/lib/types";

const RECURRING_THRESHOLD = 3;
const COVERAGE_WINDOW_DAYS = 60;
const COVERAGE_TOP_N = 8;

export interface SchoolRecurringPatternStudent {
  id: string;
  name: string;
  href: string;
}

export interface SchoolRecurringPattern {
  skill: TrainingSkill;
  label: string;
  studentCount: number;
  /** Distinct CURRENT primary instructors among the affected students -- not the instructor(s) who happened to teach the flights where the pattern appeared, which nothing in the app tracks at this grain. */
  instructorCount: number;
  students: SchoolRecurringPatternStudent[];
}

export interface SchoolCoverageItem {
  skill: TrainingSkill;
  label: string;
  category: TrainingCategory;
  occurrences: number;
}

export interface SchoolNeedsWorkItem {
  skill: TrainingSkill;
  label: string;
  studentCount: number;
}

export interface SchoolV2Insights {
  recurringPatterns: SchoolRecurringPattern[];
  coverage: SchoolCoverageItem[];
  needsWork: SchoolNeedsWorkItem[];
  /** Only handoffs where the student's own recurring theme survived the change -- see computeContinuityForRoster's themeSummary. A bare "instructor changed" isn't a pattern Insights owns; Instructor Detail already shows every handoff regardless. */
  continuity: SchoolContinuityItem[];
  /** Training-pattern students only (recurring theme or a genuine stale gap) -- never a bare pending-debrief workflow item, which Overview already owns. */
  studentsToWatch: SchoolAttentionItem[];
}

/**
 * Groups recurringStudentIssues (already org-wide, already the "3+ of last
 * 4 debriefs" persistence threshold canonical /admin/insights uses) by
 * skill, school-wide. Pure function, no repository calls, so it's testable
 * without a fake repo -- computeSchoolV2Insights below is the only caller
 * that has to fetch the two lists it combines.
 */
export function aggregateRecurringPatterns(
  issues: RecurringStudentIssue[],
  roster: SchoolV2RosterEntry[],
): SchoolRecurringPattern[] {
  const byStudentId = new Map(roster.map((e) => [e.student.id, e]));
  const bySkill = new Map<TrainingSkill, { label: string; studentIds: Set<string>; instructorIds: Set<string> }>();

  for (const issue of issues) {
    const bucket = bySkill.get(issue.skill) ?? { label: issue.label, studentIds: new Set<string>(), instructorIds: new Set<string>() };
    bucket.studentIds.add(issue.student.id);
    const rosterEntry = byStudentId.get(issue.student.id);
    if (rosterEntry) bucket.instructorIds.add(rosterEntry.primaryInstructorId);
    bySkill.set(issue.skill, bucket);
  }

  return Array.from(bySkill.entries())
    .map(([skill, bucket]) => ({
      skill,
      label: bucket.label,
      studentCount: bucket.studentIds.size,
      instructorCount: bucket.instructorIds.size,
      students: Array.from(bucket.studentIds)
        .map((id) => ({ id, name: byStudentId.get(id)?.student.name ?? "—", href: `/school-v2/students/${id}` }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.studentCount - a.studentCount);
}

/**
 * Insights owns patterns, Overview owns immediate workflow exceptions --
 * so this keeps only the two schoolAttentionFromRoster reasons that
 * describe a longer-term training pattern (a recurring theme, a genuine
 * stale gap) and drops the two that are pure debrief-lifecycle workflow
 * (an in-flight debrief stuck somewhere, an upcoming lesson missing
 * objectives) even though those also come from the same function.
 */
export function selectStudentsToWatch(attentionItems: SchoolAttentionItem[]): SchoolAttentionItem[] {
  return attentionItems.filter((item) => item.reason === "recurring_theme" || item.reason === "stale_gap");
}

/**
 * School V2's Insights -- "what patterns are emerging," not a repeat of
 * Overview's "who needs attention right now." Every section wraps an
 * existing, already-org-scoped lib/training-insights.ts function (or the
 * shared continuity/attention logic) instead of a new calculation:
 * recurringStudentIssues -> Recurring Across the School (grouped by skill,
 * new logic is only the grouping itself), trainingCoverage + mostCommonIssues
 * -> Training Coverage/Themes, computeContinuityForRoster -> Continuity &
 * Handoffs (filtered to theme-carrying cases), schoolAttentionFromRoster ->
 * Students to Watch (filtered to pattern reasons, excluding bare workflow
 * items Overview already owns).
 *
 * Deliberately omitted, per the SCHOOL-V2-1/2 gap list: no "skills with an
 * improving trend" (no trend-detection function exists -- training-insights.ts's
 * own doc comment says nothing here does statistical trend detection) and no
 * "areas receiving little recent coverage" (would read as a curriculum-
 * completion metric against a syllabus this app doesn't have -- trainingCoverage's
 * own doc comment says the same).
 */
export async function computeSchoolV2Insights(repo: Repository, viewer: Viewer): Promise<SchoolV2Insights> {
  const organizationId = viewer.organization.id;

  const [roster, issues, coverage, needsWorkRaw] = await Promise.all([
    computeSchoolV2Roster(repo, organizationId),
    recurringStudentIssues(repo, organizationId, RECURRING_THRESHOLD),
    trainingCoverage(repo, organizationId, COVERAGE_WINDOW_DAYS),
    mostCommonIssues(repo, organizationId),
  ]);

  const recurringPatterns = aggregateRecurringPatterns(issues, roster);
  const needsWork: SchoolNeedsWorkItem[] = needsWorkRaw.map((i) => ({ skill: i.skill, label: i.label, studentCount: i.studentCount }));

  const allContinuity = await computeContinuityForRoster(repo, roster);
  const continuity = allContinuity.filter((c) => c.themeSummary !== null);

  const attentionItems = await schoolAttentionFromRoster(repo, roster);
  const studentsToWatch = selectStudentsToWatch(attentionItems);

  return {
    recurringPatterns,
    coverage: coverage.slice(0, COVERAGE_TOP_N),
    needsWork,
    continuity,
    studentsToWatch,
  };
}
