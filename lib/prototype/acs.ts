import { ACS_AREAS, SKILL_SCORES, type AcsArea, type SkillScore, type SkillState } from "@/lib/prototype/vector-data";

/**
 * The FAA ACS, as a structure rather than a relabelled skill list.
 *
 * Progress has two views of the same evidence and they answer different
 * questions. SKILLS asks "what am I getting better at" and is organised the way
 * a student thinks about their own flying. ACS asks "how am I tracking against
 * what I have to demonstrate on the checkride", and that question has a shape
 * the student does not get to choose: Area of Operation -> Task, as published.
 *
 * The important consequence is that this view has ROWS THE STUDENT HAS NO SCORE
 * FOR. A skills list only contains things that have been assessed, so it can
 * never show what has not been touched -- and on a checkride, what has not been
 * touched is most of the answer. Tasks with no assessment render as "Not
 * assessed yet" with no meter, because a 0/4 meter would claim an assessment of
 * zero where there is simply no assessment at all.
 *
 * NO SECOND SCORING MODEL. A task's level is the LOWEST level of the skills
 * assessed under it, on the same three-state scale used everywhere else -- a
 * task is not at standard while a component of it is not. That is an ACS
 * rollup, which MASTER.md §2 explicitly sanctions as one of the three places a
 * state colour is allowed to appear. Nothing here introduces a level, a point,
 * a percentage or a readiness verdict.
 */

export interface AcsTask {
  /** Published task code. Shown as metadata, never as a headline. */
  code: string;
  name: string;
  /**
   * Skill slugs assessed under this task. Empty means the task has not come up
   * yet, which is a normal state at 28 hours and not a gap to fill with a zero.
   * More than one is normal too -- "Stabilized Approach" and "Crosswind
   * Landing" are both aspects of the same published task.
   */
  skills: string[];
}

export interface AcsAreaGroup {
  area: AcsArea;
  tasks: AcsTask[];
}

/**
 * Two Areas of Operation, because those are the two this student's lessons
 * have actually touched. Deliberately not the whole ACS: a private-pilot
 * matrix of eleven Areas is a document, not a screen, and MASTER.md §11 is
 * explicit that ACS is a quiet structural layer rather than a database the
 * student browses.
 */
export const ACS_STRUCTURE: AcsAreaGroup[] = [
  {
    area: ACS_AREAS.landings,
    tasks: [
      { code: "PA.IV.A", name: "Normal Takeoff and Climb", skills: [] },
      // Crosswind is a CONDITION of the normal landing task in the published
      // ACS, not a task of its own -- which is why both of this student's open
      // landing skills roll up here.
      { code: "PA.IV.B", name: "Normal Approach and Landing", skills: ["crosswind-landing", "stabilized-approach"] },
      { code: "PA.IV.D", name: "Soft-Field Approach and Landing", skills: [] },
      { code: "PA.IV.F", name: "Short-Field Approach and Landing", skills: ["short-field-landing"] },
      { code: "PA.IV.M", name: "Go-Around / Rejected Landing", skills: [] },
    ],
  },
  {
    area: ACS_AREAS.airport,
    tasks: [
      { code: "PA.III.A", name: "Radio Communications and ATC Light Signals", skills: ["radio-work"] },
      { code: "PA.III.B", name: "Traffic Patterns", skills: [] },
      { code: "PA.III.C", name: "Airport, Runway and Taxiway Signs, Markings and Lighting", skills: [] },
    ],
  },
];

export interface TaskProgress {
  task: AcsTask;
  /** The assessed skills behind this task, in list order. The evidence. */
  skills: SkillScore[];
  /** Null when nothing under this task has been assessed. Never a zero. */
  state: SkillState | null;
  score: number | null;
  max: number;
}

const STATE_RANK: Record<SkillState, number> = { "Needs Work": 0, Improving: 1, "Meets Standard": 2 };

/** A task stands where its weakest assessed component stands. */
export function taskProgress(task: AcsTask): TaskProgress {
  const skills = task.skills
    .map((slug) => SKILL_SCORES.find((s) => s.slug === slug))
    .filter((s): s is SkillScore => Boolean(s));
  if (skills.length === 0) return { task, skills, state: null, score: null, max: 4 };
  const weakest = skills.reduce((a, b) => (STATE_RANK[b.state] < STATE_RANK[a.state] ? b : a));
  return { task, skills, state: weakest.state, score: weakest.score, max: weakest.max };
}

export interface AcsReadiness {
  areas: { area: AcsArea; tasks: TaskProgress[] }[];
  /** Tasks with at least one assessment behind them. */
  assessed: number;
  /** Of those, how many stand at Meets Standard. */
  meetingStandard: number;
  notAssessed: number;
  total: number;
}

/**
 * The readiness summary.
 *
 * Counts, not a verdict. "2 of 3 assessed tasks meeting standard" is a
 * statement about assessments the instructor has already made, and the
 * `notAssessed` figure is carried alongside it so the number can never be read
 * as "you are two thirds ready" -- most of the checkride has not happened yet,
 * and the screen has to say so in the same breath. There is no percentage, and
 * the signoff stays the instructor's.
 */
export function acsReadiness(): AcsReadiness {
  const areas = ACS_STRUCTURE.map((g) => ({ area: g.area, tasks: g.tasks.map(taskProgress) }));
  const all = areas.flatMap((a) => a.tasks);
  const assessed = all.filter((t) => t.state !== null);
  return {
    areas,
    assessed: assessed.length,
    meetingStandard: assessed.filter((t) => t.state === "Meets Standard").length,
    notAssessed: all.length - assessed.length,
    total: all.length,
  };
}

/** The task a skill is assessed under, for the skill-detail screen. */
export function taskForSkill(slug: string): { area: AcsArea; task: AcsTask } | undefined {
  for (const group of ACS_STRUCTURE) {
    const task = group.tasks.find((t) => t.skills.includes(slug));
    if (task) return { area: group.area, task };
  }
  return undefined;
}
