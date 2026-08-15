export function AssessmentProgress({ rated, total }: { rated: number; total: number }) {
  const pct = total > 0 ? Math.round((rated / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-foreground-soft">
        <span>
          {rated} of {total} rated
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
