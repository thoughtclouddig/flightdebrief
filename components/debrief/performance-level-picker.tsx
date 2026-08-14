"use client";

import { PERFORMANCE_LEVELS, type PerformanceLevelCode } from "@/lib/performance-levels";
import { cn } from "@/lib/utils";

export function PerformanceLevelPicker({
  value,
  onChange,
  disabled,
}: {
  value: PerformanceLevelCode | null;
  onChange: (level: PerformanceLevelCode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {PERFORMANCE_LEVELS.map((level) => (
        <button
          key={level.code}
          type="button"
          disabled={disabled}
          onClick={() => onChange(level.code)}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
            value === level.code
              ? "border-brand bg-brand text-white"
              : "border-hairline bg-transparent text-foreground hover:bg-surface-sunken",
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
