import { cn } from "@/lib/utils";

/**
 * Ranked horizontal bars for a single series of named counts -- the form for
 * "compare magnitudes across categories", which is what both the training
 * issues list and the coverage list actually are. They were a plain list and
 * a chip cloud, where the only way to compare two numbers was to read them.
 *
 * One series, so no legend (the card title names it) and no categorical
 * palette -- just the brand hue.
 *
 * It stays --brand in both themes rather than darkening for light mode. The
 * 3:1 non-text contrast rule covers graphics *required* to understand the
 * content, and the count is printed in text beside every bar, so the mark is
 * supplementary: the whole list reads correctly with no color at all. Paying
 * for contrast the bar doesn't need cost the brand orange and looked muddy.
 *
 * Values wear text tokens rather than the bar color -- the mark carries
 * magnitude, the text carries the number, neither depends on the other.
 */
export interface InsightBarDatum {
  key: string;
  label: string;
  value: number;
  /** Rendered after the label -- e.g. an ACS reference badge. */
  adornment?: React.ReactNode;
  /** Full value text; falls back to the number. e.g. "2 students". */
  valueLabel?: string;
}

export function InsightBars({
  data,
  /** Bars are proportional to this, so several cards can share one scale. */
  max,
  className,
}: {
  data: InsightBarDatum[];
  max?: number;
  className?: string;
}) {
  if (data.length === 0) return null;
  // Guard against a zero/negative max producing NaN widths.
  const peak = Math.max(1, max ?? Math.max(...data.map((d) => d.value)));

  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {data.map((d) => {
        const pct = Math.max(2, Math.round((d.value / peak) * 100));
        return (
          <li key={d.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-foreground">
                {d.label}
                {d.adornment}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-foreground-soft">
                {d.valueLabel ?? d.value}
              </span>
            </div>
            {/* Track + fill. aria-hidden because the row above already states
                the label and the value -- a screen reader gains nothing from
                the bar and would just hear the number twice. */}
            <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
