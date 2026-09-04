"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PerformanceLevelPicker } from "@/components/debrief/performance-level-picker";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

export function TaskRatingCard({
  label,
  value,
  onChange,
  disabled,
  role,
}: {
  label: string;
  value: PerformanceLevelCode | null;
  onChange: (level: PerformanceLevelCode) => void;
  disabled?: boolean;
  role: "student" | "instructor";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3.5 py-1">
        <p className="text-base font-semibold text-foreground">{label}</p>
        <PerformanceLevelPicker value={value} onChange={onChange} disabled={disabled} role={role} />
      </CardContent>
    </Card>
  );
}
