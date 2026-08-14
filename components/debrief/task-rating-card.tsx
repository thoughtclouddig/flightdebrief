"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PerformanceLevelPicker } from "@/components/debrief/performance-level-picker";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

export function TaskRatingCard({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: PerformanceLevelCode | null;
  onChange: (level: PerformanceLevelCode) => void;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <p className="font-medium text-foreground">{label}</p>
        <PerformanceLevelPicker value={value} onChange={onChange} disabled={disabled} />
      </CardContent>
    </Card>
  );
}
