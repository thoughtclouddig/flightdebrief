import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignSkillProgress } from "@/lib/design/train-fixtures";

/**
 * Where a skill stands, as a filled meter rather than a fraction -- same
 * reasoning as the real components/student/ui.tsx's SkillMeter: a number
 * makes a student do arithmetic before they know anything, four segments
 * read in one glance.
 */
function DesignSkillMeter({ score, max, needsWork }: { score: number; max: number; needsWork: boolean }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${score} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-5 rounded-full",
            i < score ? (needsWork ? "bg-[var(--dm-accent)]" : "bg-[var(--dm-state-improving)]") : "bg-[var(--dm-border)]",
          )}
        />
      ))}
    </span>
  );
}

/**
 * Recurring skills that need work across flights, not just this debrief's
 * own plan -- deliberately below the swipeable deck, not inside it: the
 * deck is "what to do about your last debrief," this is the longer-running
 * picture. Passive rows, not actions -- there's no Vector CTA here, just a
 * chevron toward the fuller picture on Progress.
 */
export function DesignStillWorkingOn({ items }: { items: DesignSkillProgress[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--dm-border)] bg-[var(--dm-surface)]">
      {items.map((item, i) => {
        const needsWork = item.state === "Needs Work";
        return (
          <div
            key={item.skillLabel}
            className={cn("flex items-center gap-4 px-5 py-4", i !== items.length - 1 && "border-b border-[var(--dm-border)]")}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-medium text-[var(--dm-text)]">{item.skillLabel}</p>
              <p className={cn("text-[14px] font-medium", needsWork ? "text-[var(--dm-accent)]" : "text-[var(--dm-state-improving)]")}>
                {item.state}
              </p>
            </div>
            <DesignSkillMeter score={item.score} max={item.max} needsWork={needsWork} />
            <ChevronRight className="size-4 shrink-0 text-[var(--dm-text-faint)]" aria-hidden />
          </div>
        );
      })}
    </div>
  );
}
