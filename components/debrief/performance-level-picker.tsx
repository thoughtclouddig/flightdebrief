"use client";

import { PERFORMANCE_LEVELS, performanceLevelLabelFor, type PerformanceLevelCode } from "@/lib/performance-levels";
import { cn } from "@/lib/utils";

/** Selected-state color per level -- LEARNING stays neutral (nothing wrong yet, just early), INDEPENDENT reads good/green. NEEDS_COACHING deliberately does NOT use the app's --amber token here -- solid-filled at this size it reads muddy/brown rather than as a status color, so it gets its own brighter gold instead (see LEVEL_STYLE below). */
const LEVEL_TONE: Partial<Record<PerformanceLevelCode, string>> = {
  LEARNING: "border-foreground-faint bg-foreground-faint text-white",
  INDEPENDENT: "border-good bg-good text-white",
};

const NEEDS_COACHING_STYLE = { backgroundColor: "#F2A93B", borderColor: "#F2A93B", color: "#3D2A05" };

export function PerformanceLevelPicker({
  value,
  onChange,
  disabled,
  role,
}: {
  value: PerformanceLevelCode | null;
  onChange: (level: PerformanceLevelCode) => void;
  disabled?: boolean;
  /** Whose rating this is -- a student self-assessing sees "Felt Solid," not "Meets Standard," since that's the instructor's judgment against the training standard to make, not the student's. Same underlying codes either way. */
  role: "student" | "instructor";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2.5">
        {PERFORMANCE_LEVELS.map((level, i) => {
          const selected = value === level.code;
          const label = performanceLevelLabelFor(level.code, role);
          return (
            <button
              key={level.code}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level.code)}
              aria-label={label}
              aria-pressed={selected}
              title={label}
              style={selected && level.code === "NEEDS_COACHING" ? NEEDS_COACHING_STYLE : undefined}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors disabled:opacity-50",
                selected
                  ? (LEVEL_TONE[level.code] ?? "")
                  : "border-hairline bg-transparent text-foreground-soft hover:bg-surface-sunken",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <span className="min-w-0 truncate text-sm font-medium text-foreground-soft">
        {value ? performanceLevelLabelFor(value, role) : "Not yet rated"}
      </span>
    </div>
  );
}
