/**
 * Turns raw airport flight records into the findings a page can publish.
 *
 * Pure functions over rows, deliberately: the aggregation is the part that
 * has to be right, and it should be testable without a database, an API key,
 * or a network. Ingestion and storage live elsewhere.
 *
 * The unit is a FLIGHT, not a movement. The data source reports a 1.4-hour
 * local lesson containing a dozen touch-and-goes as one record, so calling
 * these "operations" would overstate every figure by an order of magnitude.
 * Nothing in this file says operations.
 *
 * Every result carries the window and the sample size it came from. That is
 * not decoration -- an unattributed number is an assertion, and the whole
 * point of publishing this data is that it can be cited. The same standard
 * the article fact-checker applies to a model's claims applies here.
 */

/**
 * "local" is the training signal: departed and returned to the same field, so
 * a lesson, pattern work, or a trip to the practice area. Counted separately
 * rather than folded into departures and arrivals.
 */
export type FlightKind = "local" | "departure" | "arrival";

export interface AirportFlight {
  kind: FlightKind;
  /** 0-23, local to the airport. */
  localHour: number;
  /** 0 = Sunday. */
  localDayOfWeek: number;
  /** 1-12, local to the airport. */
  localMonth: number;
  /** Block time where the source reports both ends. */
  durationMinutes?: number | null;
  /** Operator callsign prefix, where the source reports one. */
  operator?: string | null;
  /** For departures: where it went. Null when unknown or a local flight. */
  destination?: string | null;
}

/**
 * Meteorological seasons, not astronomical. Whole months are what training
 * activity actually tracks -- nothing about flying changes on the solstice --
 * and whole months are also what a reader can check.
 */
export const SEASONS = [
  { key: "winter", label: "Winter", months: [12, 1, 2] },
  { key: "spring", label: "Spring", months: [3, 4, 5] },
  { key: "summer", label: "Summer", months: [6, 7, 8] },
  { key: "fall", label: "Fall", months: [9, 10, 11] },
] as const;

export type SeasonKey = (typeof SEASONS)[number]["key"];

export function seasonOf(month: number): SeasonKey {
  return SEASONS.find((s) => (s.months as readonly number[]).includes(month))?.key ?? "winter";
}

export interface HourCount {
  hour: number;
  flights: number;
  /** Share of all flights, 0-1. Rounded at render time, not here. */
  share: number;
}

export interface DayCount {
  dayOfWeek: number;
  flights: number;
  share: number;
}

export interface MonthCount {
  month: number;
  flights: number;
  share: number;
}

export interface SeasonSummary {
  season: SeasonKey;
  flights: number;
  share: number;
  /**
   * The busiest local hour within this season alone. Null when the season has
   * no flights -- an absent peak is reported as absent rather than defaulting
   * to midnight.
   */
  peakHour: number | null;
}

export interface DestinationCount {
  airport: string;
  flights: number;
}

export interface OperatorCount {
  operator: string;
  flights: number;
  share: number;
}

export interface AirportInsights {
  flightCount: number;
  busiestHours: HourCount[];
  busiestDays: DayCount[];
  byMonth: MonthCount[];
  bySeason: SeasonSummary[];
  commonDestinations: DestinationCount[];
  topOperators: OperatorCount[];
  /** Share of flights that departed and returned here -- how much of a training field it is. */
  localShare: number;
  /** Median local-flight block time. Median because one ferry flight skews a mean badly. */
  medianLocalMinutes: number | null;
}

/**
 * Below this, an airport gets no page.
 *
 * A page built on forty flights reads as authoritative and isn't. The failure
 * mode of programmatic content is thousands of pages that each say almost
 * nothing, and a floor is the only thing that prevents it.
 *
 * Lower than the movement-based floor it replaces, because the unit changed:
 * one flight here is what several rows used to be.
 */
export const MIN_FLIGHT_COUNT = 250;

export function hasEnoughData(flights: AirportFlight[]): boolean {
  return flights.length >= MIN_FLIGHT_COUNT;
}

/** Median of an unsorted list, or null when empty. Even counts take the lower-middle pair's mean. */
function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function computeAirportInsights(flights: AirportFlight[]): AirportInsights {
  const total = flights.length;
  if (total === 0) {
    return {
      flightCount: 0,
      busiestHours: [],
      busiestDays: [],
      byMonth: [],
      bySeason: [],
      commonDestinations: [],
      topOperators: [],
      localShare: 0,
      medianLocalMinutes: null,
    };
  }

  const byHour = new Map<number, number>();
  const byDay = new Map<number, number>();
  const byMonth = new Map<number, number>();
  const byDestination = new Map<string, number>();
  const byOperator = new Map<string, number>();
  const seasonHours = new Map<SeasonKey, Map<number, number>>();
  const localDurations: number[] = [];
  let localCount = 0;

  for (const f of flights) {
    byHour.set(f.localHour, (byHour.get(f.localHour) ?? 0) + 1);
    byDay.set(f.localDayOfWeek, (byDay.get(f.localDayOfWeek) ?? 0) + 1);
    byMonth.set(f.localMonth, (byMonth.get(f.localMonth) ?? 0) + 1);
    if (f.operator) byOperator.set(f.operator, (byOperator.get(f.operator) ?? 0) + 1);

    const season = seasonOf(f.localMonth);
    const hours = seasonHours.get(season) ?? new Map<number, number>();
    hours.set(f.localHour, (hours.get(f.localHour) ?? 0) + 1);
    seasonHours.set(season, hours);

    if (f.kind === "local") {
      localCount++;
      if (typeof f.durationMinutes === "number" && f.durationMinutes > 0) {
        localDurations.push(f.durationMinutes);
      }
    }

    // Destinations come from departures only. Counting arrivals too would
    // double every round trip and make the busiest "destination" the airport
    // itself.
    if (f.kind === "departure" && f.destination) {
      byDestination.set(f.destination, (byDestination.get(f.destination) ?? 0) + 1);
    }
  }

  return {
    flightCount: total,
    busiestHours: [...byHour.entries()]
      .map(([hour, flights]) => ({ hour, flights, share: flights / total }))
      // Ties broken by hour so the output is stable across recomputations --
      // a page whose "busiest hour" flips between two equal hours every month
      // looks wrong even when it isn't.
      .sort((a, b) => b.flights - a.flights || a.hour - b.hour),
    busiestDays: [...byDay.entries()]
      .map(([dayOfWeek, flights]) => ({ dayOfWeek, flights, share: flights / total }))
      .sort((a, b) => b.flights - a.flights || a.dayOfWeek - b.dayOfWeek),
    byMonth: [...byMonth.entries()]
      .map(([month, flights]) => ({ month, flights, share: flights / total }))
      .sort((a, b) => a.month - b.month),
    bySeason: SEASONS.map(({ key }) => {
      const hours = seasonHours.get(key);
      const flights = hours ? [...hours.values()].reduce((n, v) => n + v, 0) : 0;
      const peak = hours ? [...hours.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] : undefined;
      return { season: key, flights, share: flights / total, peakHour: peak ? peak[0] : null };
    }),
    commonDestinations: [...byDestination.entries()]
      .map(([airport, flights]) => ({ airport, flights }))
      .sort((a, b) => b.flights - a.flights || a.airport.localeCompare(b.airport)),
    topOperators: [...byOperator.entries()]
      .map(([operator, flights]) => ({ operator, flights, share: flights / total }))
      .sort((a, b) => b.flights - a.flights || a.operator.localeCompare(b.operator)),
    localShare: localCount / total,
    medianLocalMinutes: median(localDurations),
  };
}

/**
 * The sentence a page states above its numbers.
 *
 * Kept next to the computation so the two can't drift: if the window changes
 * shape, the attribution changes with it. It says flights rather than
 * operations on purpose -- that distinction is the whole reason this file was
 * rewritten.
 */
export function describeSample(insights: AirportInsights, windowStart: string, windowEnd: string): string {
  const format = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return `Based on ${insights.flightCount.toLocaleString("en-US")} flights recorded between ${format(windowStart)} and ${format(windowEnd)}.`;
}
