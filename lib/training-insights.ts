import { skillLabel } from "@/lib/topics";
import type { Repository } from "@/lib/data/types";
import type { TrainingCategory, TrainingSignal, TrainingSkill, User } from "@/lib/types";

/**
 * School-level aggregation over TrainingSignal + TrainingItem, all derived
 * from data already created at debrief time (see lib/taxonomy.ts and
 * app/api/debrief/analyze/route.ts) -- nothing here re-runs AI analysis or
 * does statistical trend detection. Every threshold is a plain count,
 * intentionally conservative, and every result is framed as something for a
 * chief instructor to look at -- never a verdict about a student or CFI.
 */

export interface SkillIssueCount {
  skill: TrainingSkill;
  label: string;
  studentCount: number;
}

/** Per skill, how many distinct students currently show that skill as NEEDS_COACHING (their most recent signal for it). */
export async function mostCommonIssues(repo: Repository, organizationId: string): Promise<SkillIssueCount[]> {
  const signals = (await repo.listTrainingSignals({ organizationId })).filter((s) => !s.dismissed);
  const latestByStudentSkill = new Map<string, TrainingSignal>();
  for (const signal of signals) {
    const key = `${signal.studentId}|${signal.skill}`;
    const existing = latestByStudentSkill.get(key);
    if (!existing || signal.flightDate > existing.flightDate) latestByStudentSkill.set(key, signal);
  }
  const studentsBySkill = new Map<TrainingSkill, Set<string>>();
  for (const signal of latestByStudentSkill.values()) {
    if (signal.status !== "NEEDS_COACHING") continue;
    if (!studentsBySkill.has(signal.skill)) studentsBySkill.set(signal.skill, new Set());
    studentsBySkill.get(signal.skill)!.add(signal.studentId);
  }
  return Array.from(studentsBySkill.entries())
    .map(([skill, students]) => ({ skill, label: skillLabel(skill), studentCount: students.size }))
    .sort((a, b) => b.studentCount - a.studentCount);
}

export interface RecurringStudentIssue {
  student: User;
  skill: TrainingSkill;
  label: string;
  count: number;
  consideredFlights: number;
}

/** Students with the same skill NEEDS_COACHING in `threshold`+ of their last 4 debriefs. */
export async function recurringStudentIssues(
  repo: Repository,
  organizationId: string,
  threshold = 3,
): Promise<RecurringStudentIssue[]> {
  const [allSignals, studentMembers] = await Promise.all([
    repo.listTrainingSignals({ organizationId }),
    repo.listMembers(organizationId, "student"),
  ]);
  const signals = allSignals.filter((s) => !s.dismissed);

  const results: RecurringStudentIssue[] = [];
  for (const member of studentMembers) {
    const studentSignals = signals.filter((s) => s.studentId === member.userId);
    const flightDates = new Map<string, string>();
    for (const s of studentSignals) flightDates.set(s.flightId, s.flightDate);
    const recentFlightIds = new Set(
      Array.from(flightDates.entries())
        .sort((a, b) => b[1].localeCompare(a[1]))
        .slice(0, 4)
        .map(([id]) => id),
    );
    if (recentFlightIds.size === 0) continue;

    const flightsBySkill = new Map<TrainingSkill, Set<string>>();
    for (const s of studentSignals) {
      if (s.status !== "NEEDS_COACHING" || !recentFlightIds.has(s.flightId)) continue;
      if (!flightsBySkill.has(s.skill)) flightsBySkill.set(s.skill, new Set());
      flightsBySkill.get(s.skill)!.add(s.flightId);
    }

    const student = await repo.getUser(member.userId);
    if (!student) continue;
    for (const [skill, flightIds] of flightsBySkill) {
      if (flightIds.size >= threshold) {
        results.push({ student, skill, label: skillLabel(skill), count: flightIds.size, consideredFlights: recentFlightIds.size });
      }
    }
  }
  return results.sort((a, b) => b.count - a.count);
}

export interface CarriedForwardObjective {
  student: User;
  description: string;
  streak: number;
  /**
   * Whoever flew the most recent flight in the streak. A chief instructor
   * can't fix the objective themselves -- their lever is the conversation
   * with the CFI -- so without this the card named a problem but not who
   * owns it. Null when the flight has no instructor recorded.
   */
  instructorName: string | null;
}

/**
 * Students with the same before_next_flight/keep_working_on objective text
 * persisting across `threshold`+ consecutive completed flights. Matches the
 * mock analyzer's existing carry-forward behavior (lib/ai/mock-analyzer.ts)
 * rather than inventing a new link table -- an objective that keeps getting
 * carried forward literally keeps the same description.
 */
export async function objectivesCarriedForward(
  repo: Repository,
  organizationId: string,
  threshold = 3,
): Promise<CarriedForwardObjective[]> {
  const studentMembers = await repo.listMembers(organizationId, "student");
  const allItems = await repo.listTrainingItems();

  const results: CarriedForwardObjective[] = [];
  for (const member of studentMembers) {
    const flights = await repo.listFlights({ studentId: member.userId, organizationId });
    const completed = [...flights]
      .filter((f) => f.debriefStatus === "complete")
      .sort((a, b) => a.flightDate.localeCompare(b.flightDate));
    if (completed.length === 0) continue;

    const completedIds = new Set(completed.map((f) => f.id));
    const descriptionsByFlight = new Map<string, Set<string>>();
    for (const item of allItems) {
      if (item.category !== "before_next_flight" && item.category !== "keep_working_on") continue;
      if (!completedIds.has(item.flightId)) continue;
      const trimmed = item.description.trim();
      if (!descriptionsByFlight.has(item.flightId)) descriptionsByFlight.set(item.flightId, new Set());
      descriptionsByFlight.get(item.flightId)!.add(trimmed);
    }

    const currentStreak = new Map<string, number>();
    const maxStreak = new Map<string, number>();
    // Recorded on the flight that extended the streak furthest, so the name
    // shown is whoever last flew it rather than whoever started it.
    const instructorAtPeak = new Map<string, string | null>();
    for (const flight of completed) {
      const descriptions = descriptionsByFlight.get(flight.id) ?? new Set();
      for (const desc of Array.from(currentStreak.keys())) {
        if (!descriptions.has(desc)) currentStreak.delete(desc);
      }
      for (const desc of descriptions) {
        const next = (currentStreak.get(desc) ?? 0) + 1;
        currentStreak.set(desc, next);
        if (next >= (maxStreak.get(desc) ?? 0)) {
          instructorAtPeak.set(desc, flight.instructor?.name ?? null);
        }
        maxStreak.set(desc, Math.max(maxStreak.get(desc) ?? 0, next));
      }
    }

    const student = await repo.getUser(member.userId);
    if (!student) continue;
    for (const [description, streak] of maxStreak) {
      if (streak >= threshold) {
        results.push({ student, description, streak, instructorName: instructorAtPeak.get(description) ?? null });
      }
    }
  }
  return results.sort((a, b) => b.streak - a.streak);
}

export interface CoverageItem {
  skill: TrainingSkill;
  label: string;
  category: TrainingCategory;
  occurrences: number;
}

/**
 * What skills/topics have come up in recent training, org-wide. Explicitly
 * not a syllabus-compliance measure -- there's no syllabus data yet (see
 * the request's "Future Syllabus Layer" section) to compare against.
 */
export async function trainingCoverage(repo: Repository, organizationId: string, days = 60): Promise<CoverageItem[]> {
  const signals = await repo.listTrainingSignals({ organizationId });
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = signals.filter((s) => !s.dismissed && new Date(s.flightDate).getTime() >= cutoff);

  const counts = new Map<TrainingSkill, { category: TrainingCategory; occurrences: number }>();
  for (const s of recent) {
    const entry = counts.get(s.skill) ?? { category: s.category, occurrences: 0 };
    entry.occurrences += 1;
    counts.set(s.skill, entry);
  }
  return Array.from(counts.entries())
    .map(([skill, { category, occurrences }]) => ({ skill, label: skillLabel(skill), category, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

export interface LimitedFeedbackStudent {
  student: User;
  flightsChecked: number;
}

/** Students whose last `lookback` debriefs captured zero instructor guidance quotes. */
async function limitedFeedbackStudents(
  repo: Repository,
  organizationId: string,
  lookback = 3,
): Promise<LimitedFeedbackStudent[]> {
  const studentMembers = await repo.listMembers(organizationId, "student");
  const results: LimitedFeedbackStudent[] = [];

  for (const member of studentMembers) {
    const flights = await repo.listFlights({ studentId: member.userId, organizationId });
    const recentCompleted = [...flights]
      .filter((f) => f.debriefStatus === "complete")
      .sort((a, b) => b.flightDate.localeCompare(a.flightDate))
      .slice(0, lookback);
    if (recentCompleted.length < lookback) continue; // not enough data to call this a pattern yet

    const debriefs = await Promise.all(recentCompleted.map((f) => repo.getDebriefByFlight(f.id)));
    const allEmpty = debriefs.every((d) => (d?.structuredResult.instructorGuidance.length ?? 0) === 0);
    if (!allEmpty) continue;

    const student = await repo.getUser(member.userId);
    if (student) results.push({ student, flightsChecked: recentCompleted.length });
  }
  return results;
}

export type NeedsReviewReason = "Repeated Deficiency" | "Repeated Carry-Forward" | "Limited Feedback";

export interface NeedsReviewEntry {
  student: User;
  reason: NeedsReviewReason;
  detail: string;
}

/**
 * A queue of patterns worth a chief instructor's attention -- not an
 * automated disciplinary system and not a verdict on any student or
 * instructor. Two signal types from the request aren't computed here yet,
 * by design: "Possible Training Gap" needs syllabus data (explicitly future
 * work), and "Student/Instructor Disconnect" needs per-speaker transcript
 * attribution this single-narrator transcript can't reliably provide.
 */
export async function needsReviewQueue(repo: Repository, organizationId: string): Promise<NeedsReviewEntry[]> {
  const [recurring, carried, limited] = await Promise.all([
    recurringStudentIssues(repo, organizationId, 3),
    objectivesCarriedForward(repo, organizationId, 3),
    limitedFeedbackStudents(repo, organizationId, 3),
  ]);

  const entries: NeedsReviewEntry[] = [];
  for (const r of recurring) {
    entries.push({
      student: r.student,
      reason: "Repeated Deficiency",
      detail: `${r.label} has needed work in ${r.count} of the student's last ${r.consideredFlights} debriefs.`,
    });
  }
  for (const c of carried) {
    entries.push({
      student: c.student,
      reason: "Repeated Carry-Forward",
      detail: `"${c.description}" has carried forward across ${c.streak} consecutive lessons without resolving.`,
    });
  }
  for (const l of limited) {
    entries.push({
      student: l.student,
      reason: "Limited Feedback",
      detail: `The last ${l.flightsChecked} debriefs contain little to no captured instructor guidance.`,
    });
  }
  return entries;
}
