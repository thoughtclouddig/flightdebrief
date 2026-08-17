"use client";

import { useId } from "react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";
import type { FlightScoreData, FlightScoreTone } from "./types";

const TONE_GRADIENT: Record<FlightScoreTone, { from: string; to: string }> = {
  good: { from: "#4ade80", to: "#16803d" },
  amber: { from: "#fbbf24", to: "#b45309" },
  danger: { from: "#f87171", to: "#a3241c" },
};

/** Pure math, no DOM/React needed -- exported for direct unit testing. */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/** Pure math, no DOM/React needed -- exported for direct unit testing. */
export function gaugeGeometry(size: number, strokeWidth?: number) {
  const width = strokeWidth ?? size * 0.09;
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  return { radius, circumference, strokeWidth: width };
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
  /** Compact contexts (e.g. a small card mockup) need the label in sentence case, single line -- the default uppercase/wide-tracking treatment wraps ugly below ~150px. */
  labelUppercase?: boolean;
  /** Small secondary line under the label, e.g. "Last 8 flights" -- omitted entirely when not given. */
  caption?: string;
}

type AvailableProps = FlightScoreData & BaseProps & { unavailable?: false; building?: false };

/** No real score to show yet -- renders a dashed empty ring and "--" instead of fabricating or borrowing a number. */
interface UnavailableProps extends BaseProps {
  unavailable: true;
  building?: false;
  label: string;
}

/**
 * Cold-start state: some CFI-reviewed evidence exists, but not enough to
 * clear the confidence threshold (see lib/flight-score.ts's
 * MIN_OBSERVATIONS_FOR_SCORE / MIN_FLIGHTS_FOR_SCORE). Distinct from
 * UnavailableProps -- "--" implies scoring doesn't exist yet at all, while
 * this implies training data is actively accumulating toward a real score.
 * Renders a muted, brand-tinted dashed ring (never a fabricated fill amount
 * -- there's no validated way to turn "3 of 5 observations" into a
 * percentage of a score) with an evidence count instead of a number.
 */
interface BuildingProps extends BaseProps {
  building: true;
  unavailable?: false;
  skillsObserved: number;
  flightsObserved: number;
}

export type FlightScoreGaugeProps = AvailableProps | UnavailableProps | BuildingProps;

export function FlightScoreGauge(props: FlightScoreGaugeProps) {
  const { size = 200, animated = true, className, labelUppercase = true } = props;
  const { ref, inView } = useInView<HTMLDivElement>();
  const { radius, circumference, strokeWidth } = gaugeGeometry(size);
  const center = size / 2;
  const gradientId = useId();
  const shadowId = useId();
  const numberSize = size * 0.24;
  const labelSize = Math.max(10, size * 0.062);

  if (props.unavailable) {
    const { label } = props;
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
            strokeWidth={strokeWidth}
            strokeDasharray="1 11"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="font-display font-bold text-foreground-faint" style={{ fontSize: numberSize }}>
            &mdash;
          </span>
          <span
            className={cn("mt-1 whitespace-nowrap font-semibold text-foreground-faint", labelUppercase && "uppercase")}
            style={{ fontSize: labelSize, letterSpacing: labelUppercase ? "0.14em" : "normal" }}
          >
            {label}
          </span>
        </div>
      </div>
    );
  }

  if (props.building) {
    const { skillsObserved, flightsObserved } = props;
    const evidenceSize = Math.max(10, size * 0.056);
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
            stroke="var(--color-brand)"
            strokeOpacity={0.35}
            strokeWidth={strokeWidth}
            strokeDasharray="1 11"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="font-display font-bold text-foreground-soft" style={{ fontSize: numberSize * 0.72 }}>
            Building
          </span>
          <span className="mt-1.5 whitespace-nowrap font-medium text-foreground-faint" style={{ fontSize: evidenceSize }}>
            {skillsObserved} {skillsObserved === 1 ? "skill" : "skills"} observed
          </span>
          <span className="whitespace-nowrap font-medium text-foreground-faint" style={{ fontSize: evidenceSize }}>
            {flightsObserved} guided {flightsObserved === 1 ? "debrief" : "debriefs"}
          </span>
        </div>
      </div>
    );
  }

  const { score, tone, label, caption } = props;
  const displayScore = clampScore(score);
  const filledScore = animated ? (inView ? displayScore : 0) : displayScore;
  const offset = strokeOffsetFor(filledScore, circumference);
  const gradient = TONE_GRADIENT[tone];

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Soft ambient glow beneath the ring -- lifts it off flat backgrounds the way native iOS rings sit on a card. */}
      <div
        className="absolute rounded-full opacity-[0.16]"
        style={{
          width: size * 0.92,
          height: size * 0.92,
          background: `radial-gradient(circle, ${gradient.to} 0%, transparent 72%)`,
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
          <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={gradient.to} floodOpacity="0.35" />
          </filter>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-hairline)" strokeWidth={strokeWidth} strokeOpacity={0.5} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#${shadowId})`}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span
          className={cn("whitespace-nowrap font-semibold text-foreground-soft", labelUppercase && "uppercase")}
          style={{ fontSize: labelSize, letterSpacing: labelUppercase ? "0.14em" : "normal" }}
        >
          {label}
        </span>
        {caption ? (
          <span className="mt-2 whitespace-nowrap text-lg font-medium text-foreground-soft">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}
