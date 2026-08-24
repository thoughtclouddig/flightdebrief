import type { CSSProperties } from "react";
import type { FlightScoreTone } from "@/components/flight-score/types";

const TONE_GRADIENT: Record<FlightScoreTone, { from: string; to: string }> = {
  good: { from: "#4ade80", to: "#16803d" },
  amber: { from: "#fbbf24", to: "#b45309" },
  danger: { from: "#f87171", to: "#a3241c" },
};

/** Marketing-only responsive gauge rendered without client-side hydration. */
export function MarketingFlightScoreGauge({
  score,
  label,
  tone,
  caption,
}: {
  score: number;
  label: string;
  tone: FlightScoreTone;
  caption: string;
}) {
  const gradient = TONE_GRADIENT[tone];
  const targetOffset = 1 - Math.max(0, Math.min(100, score)) / 100;

  return (
    <div className="relative inline-flex size-[260px] items-center justify-center sm:size-[440px]">
      <div
        className="absolute size-[92%] rounded-full opacity-[0.16]"
        style={{ background: `radial-gradient(circle, ${gradient.to} 0%, transparent 72%)` }}
      />
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="marketing-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45.5" fill="none" stroke="var(--color-hairline)" strokeOpacity="0.5" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="45.5"
          pathLength={1}
          fill="none"
          stroke="url(#marketing-score-gradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={targetOffset}
          style={{ "--marketing-gauge-offset": targetOffset } as CSSProperties}
        />
      </svg>
      <div className="relative flex flex-col items-center justify-center text-center">
        <span className="font-semibold uppercase tracking-[0.14em] text-foreground-soft sm:text-[27px]">
          {label}
        </span>
        <span className="mt-2 text-lg font-medium text-foreground-soft">{caption}</span>
      </div>
    </div>
  );
}
