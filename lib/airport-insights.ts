/**
 * Turns raw airport observations into the findings a page can publish.
 *
 * Pure functions over rows, deliberately: the aggregation is the part that
 * has to be right, and it should be testable without a database, an API key,
 * or a network. Ingestion and storage live elsewhere.
 *
 * Every result carries the window and the sample size it came from. That is
 * not decoration -- an unattributed number is an assertion, and the whole
 * point of publishing this data is that it can be cited. The same standard
 * the article fact-checker applies to a model's claims applies here.
 */

export type OperationType = "arrival" | "departure" | "pattern";

export interface AirportOperation {
  operationType: OperationType;
  /** 0-23, local to the airport. */
  localHour: number;
  /** 0 = Sunday. */
  localDayOfWeek: number;
  runway: string | null;
  /** For departures: where it went. Null when unknown or a pattern flight. */
  destination?: string | null;
}

export interface HourCount {
  hour: number;
  operations: number;
  /** Share of all operations, 0-1. Rounded at render time, not here. */
  share: number;
}

export interface DayCount {
  dayOfWeek: number;
  operations: number;
  share: number;
}

export interface RunwayUse {
  runway: string;
  operations: number;
  share: number;
}

export interface DestinationCount {
  airport: string;
  flights: number;
}

export interface AirportInsights {
  sampleSize: number;
  busiestHours: HourCount[];
  busiestDays: DayCount[];
  runwayUse: RunwayUse[];
  commonDestinations: DestinationCount[];
  /** Pattern work as a share of all operations -- how much of a training field it is. */
  patternShare: number;
}

/**
 * Below this, an airport gets no page.
 *
 * A page built on forty observations reads as authoritative and isn't. The
 * failure mode of programmatic content is thousands of pages that each say
 * almost nothing, and a floor is the only thing that prevents it.
 */
export const MIN_SAMPLE_SIZE = 500;

export function hasEnoughData(operations: AirportOperation[]): boolean {
  return operations.length >= MIN_SAMPLE_SIZE;
}

export function computeAirportInsights(operations: AirportOperation[]): AirportInsights {
  const total = operations.length;
  if (total === 0) {
    return {
      sampleSize: 0,
      busiestHours: [],
      busiestDays: [],
      runwayUse: [],
      commonDestinations: [],
      patternShare: 0,
    };
  }

  const byHour = new Map<number, number>();
  const byDay = new Map<number, number>();
  const byRunway = new Map<string, number>();
  const byDestination = new Map<string, number>();
  let patternCount = 0;

  for (const op of operations) {
    byHour.set(op.localHour, (byHour.get(op.localHour) ?? 0) + 1);
    byDay.set(op.localDayOfWeek, (byDay.get(op.localDayOfWeek) ?? 0) + 1);
    if (op.runway) byRunway.set(op.runway, (byRunway.get(op.runway) ?? 0) + 1);
    if (op.operationType === "pattern") patternCount++;
    // Destinations come from departures only. Counting arrivals too would
    // double every round trip and make the busiest "destination" the airport
    // itself.
    if (op.operationType === "departure" && op.destination) {
      byDestination.set(op.destination, (byDestination.get(op.destination) ?? 0) + 1);
    }
  }

  return {
    sampleSize: total,
    busiestHours: [...byHour.entries()]
      .map(([hour, operations]) => ({ hour, operations, share: operations / total }))
      // Ties broken by hour so the output is stable across recomputations --
      // a page whose "busiest hour" flips between two equal hours every month
      // looks wrong even when it isn't.
      .sort((a, b) => b.operations - a.operations || a.hour - b.hour),
    busiestDays: [...byDay.entries()]
      .map(([dayOfWeek, operations]) => ({ dayOfWeek, operations, share: operations / total }))
      .sort((a, b) => b.operations - a.operations || a.dayOfWeek - b.dayOfWeek),
    runwayUse: [...byRunway.entries()]
      .map(([runway, operations]) => ({ runway, operations, share: operations / total }))
      .sort((a, b) => b.operations - a.operations || a.runway.localeCompare(b.runway)),
    commonDestinations: [...byDestination.entries()]
      .map(([airport, flights]) => ({ airport, flights }))
      .sort((a, b) => b.flights - a.flights || a.airport.localeCompare(b.airport)),
    patternShare: patternCount / total,
  };
}

/**
 * The sentence a page states above its numbers.
 *
 * Kept next to the computation so the two can't drift: if the window changes
 * shape, the attribution changes with it.
 */
export function describeSample(insights: AirportInsights, windowStart: string, windowEnd: string): string {
  const format = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return `Based on ${insights.sampleSize.toLocaleString("en-US")} operations recorded between ${format(windowStart)} and ${format(windowEnd)}.`;
}
