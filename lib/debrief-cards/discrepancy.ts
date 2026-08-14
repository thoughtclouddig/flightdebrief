import { performanceLevelRank, type PerformanceLevelCode } from "@/lib/performance-levels";
import type { DiscrepancyStatus } from "@/lib/types";

export function discrepancyDistance(a: PerformanceLevelCode, b: PerformanceLevelCode): number {
  return Math.abs(performanceLevelRank(a) - performanceLevelRank(b));
}

export function discrepancyStatusFor(distance: number): DiscrepancyStatus {
  if (distance >= 2) return "significant";
  if (distance === 1) return "minor";
  return "none";
}
