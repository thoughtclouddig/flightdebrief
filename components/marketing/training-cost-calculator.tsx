"use client";

import { useId, useState } from "react";

/**
 * What a repeated lesson costs, in the student's own numbers.
 *
 * Deliberately arithmetic and nothing more. It multiplies two figures the
 * student supplies and shows the product -- it does not model a saving, does
 * not assume AfterFlight recovers any of it, and does not project a
 * certification timeline. The honest claim available here is "this is what
 * that hour costs you", and anything past that is a promise about someone
 * else's flying.
 *
 * Hence no "with AfterFlight" column, no before/after bar, and a disclaimer
 * that is part of the output rather than fine print under it.
 */
const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const MAX_HOURS = 15;

/*
 * Stacked, not side by side.
 *
 * This used to split into two columns at lg, which was right when it sat in a
 * 1000px block of its own. It now lives in one half of the economics section's
 * two-column grid, so lg fires while the available width is about half that --
 * "Aircraft + instructor rate" wrapped to two lines, "hours spent repeating or
 * rebuilding context" to three, and "per hour" broke away from its input.
 * Stacking gives every label its own line and hands the figure the full width
 * of the column, which is the right emphasis anyway.
 */
export function TrainingCostCalculator() {
  const [rate, setRate] = useState(325);
  const [hours, setHours] = useState(5);
  const rateId = useId();
  const hoursId = useId();

  // A cleared rate field parses to NaN, which would render "$NaN" in the
  // output while the student is mid-edit. Treat it as zero for the maths and
  // leave the field itself empty so the caret behaves.
  const safeRate = Number.isFinite(rate) ? rate : 0;
  const total = safeRate * hours;

  return (
    <div className="grid grid-cols-1 gap-7 rounded-[24px] border border-black/[0.06] bg-white px-7 py-8 sm:px-9 sm:py-9">
      <div className="flex flex-col gap-7">
        <div>
          <label htmlFor={rateId} className="block text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">
            Aircraft + instructor rate
          </label>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="font-display text-xl font-bold text-[#101727]" aria-hidden>
              $
            </span>
            <input
              id={rateId}
              type="number"
              inputMode="numeric"
              min={0}
              max={2000}
              step={5}
              value={Number.isFinite(rate) ? rate : ""}
              onChange={(e) => setRate(e.target.valueAsNumber)}
              className="h-11 w-32 rounded-lg border border-[#d5d9dd] px-3 text-base font-semibold tabular-nums text-[#101727] focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
            <span className="text-base text-[#68717D]">per hour</span>
          </div>
        </div>

        <div>
          <label htmlFor={hoursId} className="block text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">
            Hours spent repeating or rebuilding context
          </label>
          <div className="mt-3 flex items-center gap-4">
            <input
              id={hoursId}
              type="range"
              min={0}
              max={MAX_HOURS}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(e.target.valueAsNumber)}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-[color:var(--color-brand,#f07621)]"
            />
            <span className="w-20 shrink-0 text-right text-base font-semibold tabular-nums text-[#101727]">
              {hours} {hours === 1 ? "hr" : "hrs"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-black/[0.08] pt-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">That costs you</p>
        {/* aria-live so the figure is announced as the slider moves; the
            equation stays visible because the number alone is not checkable. */}
        <p
          aria-live="polite"
          className="font-display mt-2 text-balance text-5xl font-extrabold tabular-nums leading-none text-brand sm:text-6xl"
        >
          {CURRENCY.format(total)}
        </p>
        <p className="mt-3 text-sm tabular-nums text-[#68717D]">
          {hours} {hours === 1 ? "hour" : "hours"} &times; {CURRENCY.format(safeRate)}/hr
        </p>
      </div>
    </div>
  );
}
