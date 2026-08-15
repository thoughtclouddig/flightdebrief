export type FlightScoreTone = "good" | "amber" | "danger";

export interface FlightScoreCategory {
  label: string;
  score: number;
  tone: FlightScoreTone;
}

/**
 * Display-only shape -- deliberately has no connection to any real debrief
 * data. Whoever computes a real score (not yet built -- see
 * app/(product)/progress/page.tsx's honest "not available yet" state) builds
 * one of these and hands it to FlightScoreGauge; the gauge itself never
 * reaches into lib/data, lib/performance-levels.ts, or training-insight code.
 */
export interface FlightScoreData {
  score: number;
  label: string;
  tone: FlightScoreTone;
  categories?: FlightScoreCategory[];
}
