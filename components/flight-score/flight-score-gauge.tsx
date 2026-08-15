"use client";

import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";
import type { FlightScoreData, FlightScoreTone } from "./types";

const STROKE_WIDTH = 12;

const TONE_TEXT_CLASS: Record<FlightScoreTone, string> = {
  good: "text-good",
  amber: "text-amber",
  danger: "text-danger",
};

/** Pure math, no DOM/React needed -- exported for direct unit testing. */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/** Pure math, no DOM/React needed -- exported for direct unit testing. */
export function gaugeGeometry(size: number, strokeWidth: number = STROKE_WIDTH) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  return { radius, circumference };
}

/** stroke-dashoffset for a given (clamped) score against a circle's circumference -- 0 = fully filled, circumference = empty. */
export function strokeOffsetFor(score: number, circumference: number): number {
  return circumference * (1 - clampScore(score) / 100);
}

interface BaseProps {
  size?: number;
  /** Mount-triggered fill animation when the gauge scrolls into view; disabled entirely under prefers-reduced-motion (see useInView). */
  animated?: boolean;
  className?: string;
}

type AvailableProps = FlightScoreData & BaseProps & { unavailable?: false };

/** No real score to show yet -- renders a dashed empty ring and "--" instead of fabricating or borrowing a number. */
interface UnavailableProps extends BaseProps {
  unavailable: true;
  label: string;
}

export type FlightScoreGaugeProps = AvailableProps | UnavailableProps;

export function FlightScoreGauge(props: FlightScoreGaugeProps) {
  const { size = 200, animated = true, className, label } = props;
  const { ref, inView } = useInView<HTMLDivElement>();
  const { radius, circumference } = gaugeGeometry(size);
  const center = size / 2;

  if (props.unavailable) {
    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-hairline)"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray="6 8"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="font-display text-4xl font-bold text-foreground-faint">&mdash;</span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground-faint">{label}</span>
        </div>
      </div>
    );
  }

  const { score, tone } = props;
  const displayScore = clampScore(score);
  const filledScore = animated ? (inView ? displayScore : 0) : displayScore;
  const offset = strokeOffsetFor(filledScore, circumference);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-hairline)" strokeWidth={STROKE_WIDTH} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(TONE_TEXT_CLASS[tone], "transition-[stroke-dashoffset] duration-1000 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span className="font-display text-4xl font-bold tabular-nums text-foreground">{Math.round(displayScore)}</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground-soft">{label}</span>
      </div>
    </div>
  );
}
