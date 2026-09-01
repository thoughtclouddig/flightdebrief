"use client";

// stateTone() below lives in the client-only ui.tsx, so this component has to
// be in the client graph to call it. Without the directive it worked on
// /debrief/latest -- a client page pulls it in -- and threw "Attempted to call
// stateTone() from the server" on every server-rendered skill-detail route.
import { Card, SkillMeter, stateTone } from "@/components/prototype/ui";
import { cn } from "@/lib/utils";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import { ASSESSMENT_LEVELS, agreement, levelLabel, levelScore, levelState, type Rater } from "@/lib/prototype/assessment";

/**
 * One lesson objective, rated by both people, shown side by side.
 *
 * Agreement carries the same visual weight as disagreement. A view that
 * highlights only gaps reads as a list of faults, and "you and your instructor
 * both think this is solid" is information a student needs in order to trust
 * their own judgment at all -- which is the thing that eventually lets them
 * fly without one.
 *
 * Both ratings render on the same meter and the same color scale, so the
 * distance between them is legible without reading the labels. The labels
 * differ by rater on purpose (see lib/prototype/assessment.ts): the student is
 * reporting an experience, the instructor is judging against a standard.
 */
export function ObjectiveComparison({
  task,
  student,
  instructor,
  instructorName,
  children,
}: {
  task: string;
  student: PerformanceLevelCode;
  instructor: PerformanceLevelCode;
  instructorName: string;
  children?: React.ReactNode;
}) {
  const aligned = agreement(student, instructor) === "aligned";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[17px] font-medium leading-snug text-foreground">{task}</p>
        <p
          className={cn(
            "text-[13px] font-semibold uppercase tracking-[0.1em]",
            aligned ? "text-state-good" : "text-state-attention",
          )}
        >
          {aligned ? "Agreed" : "Saw it differently"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <RatingLine who="You" code={student} rater="student" />
        <RatingLine who={instructorName} code={instructor} rater="instructor" />
      </div>

      {children ? <div className="flex flex-col gap-4 border-t border-hairline pt-4">{children}</div> : null}
    </Card>
  );
}

function RatingLine({ who, code, rater }: { who: string; code: PerformanceLevelCode; rater: Rater }) {
  const state = levelState(code);
  const tone = stateTone(state);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="w-12 shrink-0 text-[15px] font-semibold text-foreground">{who}</span>
      <SkillMeter score={levelScore(code)} max={ASSESSMENT_LEVELS.length} state={state} />
      <span className={cn("w-[118px] shrink-0 text-right text-[15px] font-medium", tone.text)}>
        {levelLabel(code, rater)}
      </span>
    </div>
  );
}
