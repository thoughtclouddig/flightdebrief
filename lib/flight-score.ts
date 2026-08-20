import { categoryForSkill, categoryLabel } from "@/lib/topics";
import type { Repository } from "@/lib/data/types";
import type { SkillObservation, TrainingCategory, TrainingSkill } from "@/lib/types";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import type { FlightScoreCategory, FlightScoreData, FlightScoreTone } from "@/components/flight-score/types";

/**
 * FlightScore v1 -- computed exclusively from SkillObservation rows (see
 * lib/types.ts), which are themselves exclusively CFI-submitted structured
 * ratings (lib/data/types.ts's Repository.listInstructorSkillObservations).
 * Explicitly NOT inputs here, by construction of that upstream query:
 * transcript sentiment, AI-guessed performance, raw student self-ratings,
 * ADS-B/weather heuristics, or any unvalidated normalization algorithm. See
 * the debrief-redesign plan's FlightScore section for the full rationale.
 *
 * Two deliberately simple design choices, called out because both were easy
 * to over-engineer:
 *
 * 1. A PerformanceLevelCode is a 3-point scale (Learning/Needs Coaching/
 *    Independent), not a continuous 0-100 measurement. LEVEL_SCORE below
 *    maps each level to one fixed anchor point rather than inventing
 *    fractional precision the underlying rating doesn't have. Landing
 *    exactly on "Progressing" (75-89) never happens from a single rating --
 *    it only emerges from averaging a mix of levels across skills, which is
 *    the intended behavior (a student strong in some areas and still
 *    developing others really is "progressing" overall).
 *
 * 2. Per-skill scoring uses a plain, unweighted mean of the most recent
 *    OBSERVATIONS_PER_SKILL ratings for that skill -- no recency decay, no
 *    per-instructor or per-aircraft weighting. That's the simplest
 *    defensible aggregation given the data model; anything cleverer would be
 *    guessing at a formula nobody has validated.
 */

/** How many of a skill's most recent CFI observations feed its score -- caps how much a single bad (or lucky) attempt can swing the number, without inventing a decay curve. */
const OBSERVATIONS_PER_SKILL = 3;

/** Cold-start gate (see lib/types.ts's SkillObservation doc and the "Building" state on /progress). Both must be met before a real score is shown. */
export const MIN_OBSERVATIONS_FOR_SCORE = 5;
export const MIN_FLIGHTS_FOR_SCORE = 2;

/** Fixed anchor score for each PerformanceLevelCode -- see module doc above for why these are single points, not a formula. */
const LEVEL_SCORE: Record<PerformanceLevelCode, number> = {
  INDEPENDENT: 93,
  NEEDS_COACHING: 67,
  LEARNING: 45,
};

export type FlightScoreBand = "Strong" | "Progressing" | "Developing" | "Needs Focus";

/** The only place 0-100 gets sliced into bands -- keep every threshold here, never re-derive it elsewhere. */
export function bandFor(score: number): { band: FlightScoreBand; tone: FlightScoreTone } {
  if (score >= 90) return { band: "Strong", tone: "good" };
  if (score >= 75) return { band: "Progressing", tone: "good" };
  if (score >= 60) return { band: "Developing", tone: "amber" };
  return { band: "Needs Focus", tone: "danger" };
}

export type SkillTrend = "up" | "down" | "flat";

/**
 * Compares the earliest vs. most recent observation in a (already-windowed)
 * chronological list, with a dead band around small deltas so a 2-point
 * wobble doesn't get reported as a "trend" -- consistent with banding the
 * score heavily instead of treating small deltas as meaningful.
 */
function trendFor(windowScores: number[]): SkillTrend {
  if (windowScores.length < 2) return "flat";
  const delta = windowScores[windowScores.length - 1] - windowScores[0];
  if (delta > 5) return "up";
  if (delta < -5) return "down";
  return "flat";
}

export interface SkillScore {
  skill: TrainingSkill | (string & {});
  label: string;
  category: TrainingCategory;
  categoryLabel: string;
  score: number;
  band: FlightScoreBand;
  tone: FlightScoreTone;
  trend: SkillTrend;
  /** How many of this skill's observations fed the score (<= OBSERVATIONS_PER_SKILL). */
  observationCount: number;
  /** Total CFI-reviewed observations of this skill ever recorded, including ones outside the scoring window. */
  totalObservationCount: number;
  mostRecentNote: string | null;
  mostRecentFlightDate: string;
}

function scoreOneSkill(skill: TrainingSkill | (string & {}), observations: SkillObservation[]): SkillScore {
  const sorted = [...observations].sort((a, b) => a.flightDate.localeCompare(b.flightDate));
  const window = sorted.slice(-OBSERVATIONS_PER_SKILL);
  const windowScores = window.map((o) => LEVEL_SCORE[o.performanceLevel]);
  const score = Math.round(windowScores.reduce((sum, s) => sum + s, 0) / windowScores.length);
  const { band, tone } = bandFor(score);
  const mostRecent = window[window.length - 1];
  const category = categoryForSkill(skill);
  return {
    skill,
    label: mostRecent.taskLabel,
    category,
    categoryLabel: categoryLabel(category),
    score,
    band,
    tone,
    trend: trendFor(windowScores),
    observationCount: window.length,
    totalObservationCount: sorted.length,
    mostRecentNote: mostRecent.note,
    mostRecentFlightDate: mostRecent.flightDate,
  };
}

function trendForGroup(trends: SkillTrend[]): SkillTrend {
  const up = trends.filter((t) => t === "up").length;
  const down = trends.filter((t) => t === "down").length;
  if (up > down) return "up";
  if (down > up) return "down";
  return "flat";
}

export interface FlightScoreResult {
  /** True until both MIN_OBSERVATIONS_FOR_SCORE and MIN_FLIGHTS_FOR_SCORE are met -- see the "Building" cold-start state. */
  building: boolean;
  totalObservations: number;
  flightsObserved: number;
  skillsObserved: number;
  /** Ready-to-render gauge data, present only when !building. */
  gauge: FlightScoreData | null;
  /** Per-skill detail for trend messaging (e.g. "Steep Turns is trending upward across your last 3 observations"), present only when !building. */
  skills: SkillScore[];
}

const BUILDING_RESULT_BASE: { gauge: null; skills: SkillScore[] } = { gauge: null, skills: [] };

/** Pure aggregation over already-fetched observations -- see getFlightScoreForStudent for the repo-backed entry point. */
export function computeFlightScore(observations: SkillObservation[]): FlightScoreResult {
  const totalObservations = observations.length;
  const flightsObserved = new Set(observations.map((o) => o.flightId)).size;
  const bySkill = new Map<TrainingSkill | (string & {}), SkillObservation[]>();
  for (const obs of observations) {
    if (!bySkill.has(obs.taskCode)) bySkill.set(obs.taskCode, []);
    bySkill.get(obs.taskCode)!.push(obs);
  }
  const skillsObserved = bySkill.size;

  const building = totalObservations < MIN_OBSERVATIONS_FOR_SCORE || flightsObserved < MIN_FLIGHTS_FOR_SCORE;
  if (building) {
    return { building: true, totalObservations, flightsObserved, skillsObserved, ...BUILDING_RESULT_BASE };
  }

  const skills = Array.from(bySkill.entries())
    .map(([skill, obs]) => scoreOneSkill(skill, obs))
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel) || a.label.localeCompare(b.label));

  const overallScore = Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length);
  const overall = bandFor(overallScore);

  const byCategory = new Map<TrainingCategory, SkillScore[]>();
  for (const s of skills) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }
  const categories: FlightScoreCategory[] = Array.from(byCategory.entries())
    .map(([category, catSkills]) => {
      const categoryScore = Math.round(catSkills.reduce((sum, s) => sum + s.score, 0) / catSkills.length);
      return {
        label: categoryLabel(category),
        score: categoryScore,
        tone: bandFor(categoryScore).tone,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    building: false,
    totalObservations,
    flightsObserved,
    skillsObserved,
    gauge: {
      score: overallScore,
      label: overall.band,
      tone: overall.tone,
      categories,
    },
    skills,
  };
}

/** Repo-backed entry point -- fetches this student's CFI-reviewed skill observations and aggregates them. */
export async function getFlightScoreForStudent(repo: Repository, studentId: string): Promise<FlightScoreResult> {
  const observations = await repo.listInstructorSkillObservations(studentId);
  return computeFlightScore(observations);
}

/** Category-level trend, for messaging like "Aircraft Control is trending upward across your last four observations." Majority vote across the category's skills -- consistent with banding heavily rather than reading small deltas as meaningful. */
export function categoryTrend(skills: SkillScore[], category: TrainingCategory): SkillTrend {
  return trendForGroup(skills.filter((s) => s.category === category).map((s) => s.trend));
}
