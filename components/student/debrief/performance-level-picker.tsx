"use client";

import { cn } from "@/lib/utils";
import { levelLabel, levelState, type Rater } from "@/lib/student/assessment";
import { stateTone } from "@/lib/student/state-tone";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

const ASSESSMENT_LEVELS: PerformanceLevelCode[] = ["LEARNING", "NEEDS_COACHING", "INDEPENDENT"];

/**
 * Three levels, shown as three equal full-width choices rather than a 1-2-3
 * scale. Numbers would invite arithmetic across objectives, and an average
 * of these is precisely the aggregate readiness verdict this product does
 * not make -- see app/prototype/vector/debrief/new's own LevelPicker, which
 * this replaces both there and in the real production rating form. The two
 * used to be independently implemented (production's showed three small
 * numbered circles plus a separate "Felt Solid"/"Not yet rated" label) --
 * one canonical picker now, in the prototype's own style.
 */
export function PerformanceLevelPicker({
  rater,
  value,
  onChange,
  disabled,
}: {
  rater: Rater;
  value: PerformanceLevelCode | null;
  onChange: (level: PerformanceLevelCode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2" role="group">
      {ASSESSMENT_LEVELS.map((code) => {
        const selected = value === code;
        const tone = stateTone(levelState(code));
        return (
          <button
            key={code}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(code)}
            className={cn(
              "min-h-[44px] flex-1 cursor-pointer rounded-xl border px-2 py-2.5 text-[15px] font-medium transition-colors disabled:cursor-default disabled:opacity-50",
              selected
                ? `${tone.fill} border-transparent text-white`
                : "border-hairline bg-transparent text-foreground-soft hover:bg-surface-sunken",
            )}
          >
            {levelLabel(code, rater)}
          </button>
        );
      })}
    </div>
  );
}
