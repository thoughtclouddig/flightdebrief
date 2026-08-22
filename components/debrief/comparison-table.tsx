import { performanceLevelLabel, type PerformanceLevelCode } from "@/lib/performance-levels";
import type { DiscrepancyStatus } from "@/lib/types";
import { DiscrepancyBadge } from "@/components/debrief/discrepancy-badge";

export interface ComparisonRow {
  taskLabel: string;
  studentLevel: PerformanceLevelCode;
  instructorLevel: PerformanceLevelCode;
  status: DiscrepancyStatus;
}

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-surface-sunken text-left text-xs font-semibold uppercase tracking-wide text-foreground-soft">
          <tr>
            <th className="px-4 py-2.5">Task</th>
            <th className="px-4 py-2.5">Student</th>
            <th className="px-4 py-2.5">Instructor</th>
            <th className="px-4 py-2.5">&nbsp;</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row) => (
            <tr key={row.taskLabel}>
              <td className="px-4 py-3 font-medium text-foreground">{row.taskLabel}</td>
              <td className="px-4 py-3 text-foreground-soft">{performanceLevelLabel(row.studentLevel)}</td>
              <td className="px-4 py-3 text-foreground-soft">{performanceLevelLabel(row.instructorLevel)}</td>
              <td className="px-4 py-3">
                <DiscrepancyBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
