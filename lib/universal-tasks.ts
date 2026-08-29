import type { FlightTask, FlightTaskSource, TrainingSkill } from "@/lib/types";

/**
 * The things every flight has, whatever the lesson was about.
 *
 * The assessment rates the tasks a CFI picked for the flight, which means it
 * only ever measures the day's objective. But nobody picks "preflight
 * preparation" as today's objective -- the objective is short-field landings.
 * So preflight happened, radio calls happened, situational awareness happened,
 * and none of them got rated, on any flight, ever.
 *
 * That is a hole in exactly the wrong place. These three are the only skills
 * present on EVERY flight, which makes them the only ones where a trend line
 * would mean something -- and they were the ones collecting no data. A student
 * whose airwork is fine while their radio work quietly degrades shows up
 * nowhere in a task-driven model.
 *
 * So they are appended to every flight's task list rather than chosen. Not
 * configurable per school: they are true of every flight everywhere, and a
 * settings screen for something universal is complexity with no payoff.
 */
export const UNIVERSAL_TASKS: { taskCode: TrainingSkill; label: string }[] = [
  { taskCode: "PREFLIGHT_INSPECTION", label: "Preflight & preparation" },
  { taskCode: "RADIO_COMMUNICATIONS", label: "Radio communication" },
  { taskCode: "SITUATIONAL_AWARENESS", label: "Situational awareness" },
];

const UNIVERSAL_CODES = new Set<string>(UNIVERSAL_TASKS.map((t) => t.taskCode));

export function isUniversalTask(taskCode: string): boolean {
  return UNIVERSAL_CODES.has(taskCode);
}

/**
 * The source recorded for them.
 *
 * "syllabus" rather than a new value: they are part of the standard shape of
 * a lesson rather than something a person chose, and adding a fourth source
 * would mean touching every switch over FlightTaskSource for a distinction
 * isUniversalTask already answers.
 */
export const UNIVERSAL_TASK_SOURCE: FlightTaskSource = "syllabus";

/**
 * Merge the universal tasks into a selection.
 *
 * They go LAST. The lesson is what the debrief is about, and pushing three
 * fixed rows above it every time would bury the reason the flight happened.
 *
 * A CFI who explicitly picked one of these keeps their own version -- their
 * selection is not overwritten with an identical row, and their label wins.
 */
export function withUniversalTasks<T extends { taskCode: string; label: string; source: FlightTaskSource }>(
  chosen: T[],
): { taskCode: string; label: string; source: FlightTaskSource }[] {
  const chosenCodes = new Set(chosen.map((t) => t.taskCode));
  return [
    ...chosen,
    ...UNIVERSAL_TASKS.filter((t) => !chosenCodes.has(t.taskCode)).map((t) => ({
      taskCode: t.taskCode as string,
      label: t.label,
      source: UNIVERSAL_TASK_SOURCE,
    })),
  ];
}

/** Split a rated task list for display: the lesson, then the every-flight block. */
export function partitionTasks<T extends Pick<FlightTask, "taskCode">>(tasks: T[]): {
  lesson: T[];
  universal: T[];
} {
  return {
    lesson: tasks.filter((t) => !isUniversalTask(t.taskCode)),
    universal: tasks.filter((t) => isUniversalTask(t.taskCode)),
  };
}
