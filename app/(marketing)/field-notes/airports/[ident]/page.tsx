import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/data";
import { isContentPublic } from "@/lib/content/visibility";
import { appOrigin } from "@/lib/email";
import type { AirportInsightsRecord } from "@/lib/types";
import { TrackDensityMap } from "@/components/marketing/track-density-map";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Data that did not come from observed flights. A report resting on any of
 * these is a layout preview, not a finding: it renders a standing warning and
 * is excluded from search.
 */
const NON_EVIDENTIAL_SOURCES = new Set(["synthetic", "sample"]);

const isProvisional = (insights: AirportInsightsRecord) =>
  insights.sources.length === 0 || insights.sources.some((s) => NON_EVIDENTIAL_SOURCES.has(s));

/** Bars and axis ticks are laid out on this one grid so they cannot drift apart. */
const HOUR_GRID = { gridTemplateColumns: "repeat(24, minmax(0, 1fr))" } as const;

const SEASON_LABELS: Record<string, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};
const SEASON_MONTHS: Record<string, string> = {
  winter: "Dec–Feb",
  spring: "Mar–May",
  summer: "Jun–Aug",
  fall: "Sep–Nov",
};
const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_GRID = { gridTemplateColumns: "repeat(12, minmax(0, 1fr))" } as const;

const hourLabel = (h: number) =>
  h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`;
const pct = (share: number) => `${Math.round(share * 100)}%`;

export async function generateMetadata(
  props: PageProps<"/field-notes/airports/[ident]">,
): Promise<Metadata> {
  const { ident } = await props.params;
  const repo = getRepository();
  const [airport, insights] = await Promise.all([
    repo.getAirport(ident),
    repo.getAirportInsights(ident),
  ]);
  if (!airport || !insights) return {};

  const origin = appOrigin();
  return {
    title: `${airport.ident} traffic report — when it's busy, which runway, where people go`,
    description: `Flights at ${airport.name} (${airport.ident}) by hour, day and season, how much of it is local training, and where people go, from ${insights.flightCount.toLocaleString("en-US")} recorded flights.`,
    alternates: origin ? { canonical: `${origin}/field-notes/airports/${airport.ident.toLowerCase()}` } : undefined,
    // A provisional report must never be indexed. Doing this in metadata
    // rather than a robots.txt rule keeps the decision next to the data that
    // drives it, so it can't be left behind when the data changes.
    robots: isProvisional(insights) ? { index: false, follow: false } : undefined,
  };
}

export default async function AirportReportPage(props: PageProps<"/field-notes/airports/[ident]">) {
  if (!isContentPublic()) notFound();

  const { ident } = await props.params;
  const repo = getRepository();
  const [airport, insights, tracks] = await Promise.all([
    repo.getAirport(ident),
    repo.getAirportInsights(ident),
    repo.listAirportTracks(ident),
  ]);

  // No insights row means the airport never cleared the sample floor. That is
  // a 404 rather than an "insufficient data" page on purpose: a page whose
  // only content is an apology is still a thin page.
  if (!airport || !insights) notFound();

  const provisional = isProvisional(insights);
  const hours = insights.busiestHours;
  const peakHourFlights = hours.length ? Math.max(...hours.map((h) => h.flights)) : 0;
  const byHour = [...hours].sort((a, b) => a.hour - b.hour);
  const quietest = [...hours].filter((h) => h.flights > 0).sort((a, b) => a.flights - b.flights)[0];
  const busiestDay = insights.busiestDays[0];
  const quietestDay = insights.busiestDays[insights.busiestDays.length - 1];
  // A window has to actually span the year before anything seasonal can be
  // said about it. A single month would otherwise render under "How the year
  // changes it" showing one season, which reads as a finding and is not one.
  const windowDays = Math.round(
    (new Date(insights.windowEnd).getTime() - new Date(insights.windowStart).getTime()) / 86_400_000,
  );
  const windowSpansYear = windowDays >= 300;
  const seasons = windowSpansYear ? insights.bySeason.filter((s) => s.flights > 0) : [];
  const peakMonthFlights = insights.byMonth.length ? Math.max(...insights.byMonth.map((m) => m.flights)) : 0;

  // Only worth stating when the peak actually moves. A field whose busy hour
  // is the same all year should say nothing here rather than manufacture a
  // finding out of a one-hour wobble.
  const withPeaks = seasons.filter((s) => s.peakHour !== null);
  const earliest = withPeaks.length ? withPeaks.reduce((a, b) => (a.peakHour! <= b.peakHour! ? a : b)) : null;
  const latest = withPeaks.length ? withPeaks.reduce((a, b) => (a.peakHour! >= b.peakHour! ? a : b)) : null;
  const peakSpread =
    earliest && latest && latest.peakHour! - earliest.peakHour! >= 2
      ? { earliest, latest, hours: latest.peakHour! - earliest.peakHour! }
      : null;

  const windowLabel = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-24">
      {provisional ? (
        <div className="mb-8 rounded-xl border border-amber-300/70 bg-amber-50 px-5 py-4">
          <p className="font-display text-sm font-bold uppercase tracking-[0.1em] text-[#7a4a05]">
            Sample data — not a real finding
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#7a4a05]">
            Every number on this page is generated, not observed. It exists so the report format can be
            reviewed before a licensed data feed is in place. This page is excluded from search and must not
            be shared as fact.
          </p>
        </div>
      ) : null}

      <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-brand">
        <Link href="/field-notes" className="hover:underline">Field Notes</Link>
        <span className="px-2 text-[#c3c8cf]">/</span>Airport reports
      </p>

      <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] text-[#101727]">
        {airport.ident}: when it&rsquo;s busy, which runway, and where people go
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[#33383f]">
        {airport.name}
        {airport.municipality ? `, ${airport.municipality}` : ""}
        {airport.region ? `, ${airport.region}` : ""}.
        {" "}
        {busiestDay && hours[0] ? (
          <>
            The busiest stretch of the week is {DAY_NAMES[busiestDay.dayOfWeek]} around {hourLabel(hours[0].hour)}
            {quietest ? <>, and the quietest hour with meaningful traffic is {hourLabel(quietest.hour)}</> : null}.
          </>
        ) : null}
      </p>

      {/* The attribution sits above the numbers rather than in a footnote:
          a figure whose window and sample size are hidden is an assertion. */}
      <p className="mt-7 rounded-xl border border-hairline bg-white px-5 py-4 text-sm text-[#4f5560]">
        Based on <strong className="font-semibold text-[#101727]">{insights.flightCount.toLocaleString("en-US")}</strong>{" "}
        flights recorded between {windowLabel(insights.windowStart)} and {windowLabel(insights.windowEnd)}
        {insights.sources.length ? <> · source: {insights.sources.join(", ")}</> : null}
        {" · "}last computed {new Date(insights.computedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
      </p>

      {/* --- Hour of day ------------------------------------------------- */}
      <Section
        title="When the field is busy"
        note="Share of all recorded flights by local hour. One flight, not one landing — a lesson with a dozen touch-and-goes counts once."
      >
        <ol className="mt-6 grid h-52 items-end gap-[3px]" style={HOUR_GRID} aria-label="Flights by local hour">
          {byHour.map((h) => {
            const height = peakHourFlights ? (h.flights / peakHourFlights) * 100 : 0;
            const isPeak = h.flights === peakHourFlights && peakHourFlights > 0;
            return (
              <li
                key={h.hour}
                className="flex h-full flex-col justify-end"
                title={`${hourLabel(h.hour)} — ${h.flights.toLocaleString("en-US")} flights (${pct(h.share)})`}
              >
                {isPeak ? (
                  <span className="mb-1 text-center text-[11px] font-bold tabular-nums text-[#101727]">
                    {pct(h.share)}
                  </span>
                ) : null}
                <span
                  className={`block w-full rounded-t-[4px] ${isPeak ? "bg-brand" : "bg-brand-light"}`}
                  style={{ height: `${Math.max(height, h.flights > 0 ? 2 : 0)}%` }}
                />
              </li>
            );
          })}
        </ol>
        {/* Ticks share the bars' grid rather than being spaced by
            justify-between. They didn't before, so every label sat up to two
            hours off its bar -- a chart that reads the peak at the wrong hour
            is worse than no chart. */}
        <div className="mt-2 grid gap-[3px] text-[11px] tabular-nums text-[#5b6472]" style={HOUR_GRID}>
          {Array.from({ length: 24 }, (_, h) => (
            <span
              key={h}
              className="text-center"
              style={{ gridColumn: h + 1 }}
              aria-hidden={h % 6 !== 0 && h !== 23}
            >
              {h % 6 === 0 || h === 23 ? hourLabel(h) : ""}
            </span>
          ))}
        </div>
      </Section>

      {/* --- Day of week -------------------------------------------------- */}
      <Section title="Which days" note="Share of all recorded flights by day of week.">
        <dl className="mt-5 flex flex-col gap-2.5">
          {[...insights.busiestDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((d) => (
            <div key={d.dayOfWeek} className="flex items-center gap-4">
              <dt className="w-24 shrink-0 text-sm text-[#4f5560]">{DAY_NAMES[d.dayOfWeek]}</dt>
              <dd className="flex flex-1 items-center gap-3">
                <span
                  className={`block h-2.5 rounded-full ${d.dayOfWeek === busiestDay?.dayOfWeek ? "bg-brand" : "bg-brand-light"}`}
                  style={{ width: `${(d.share / (busiestDay?.share || 1)) * 100}%` }}
                />
                <span className="shrink-0 text-sm tabular-nums text-[#5b6472]">{pct(d.share)}</span>
              </dd>
            </div>
          ))}
        </dl>
        {busiestDay && quietestDay && busiestDay.dayOfWeek !== quietestDay.dayOfWeek ? (
          <p className="mt-5 text-[15px] leading-relaxed text-[#33383f]">
            {DAY_NAMES[busiestDay.dayOfWeek]} carries {pct(busiestDay.share)} of the week&rsquo;s traffic against{" "}
            {pct(quietestDay.share)} on {DAY_NAMES[quietestDay.dayOfWeek]} — roughly{" "}
            {(busiestDay.share / quietestDay.share).toFixed(1)}× the movement for the same hour of the day.
          </p>
        ) : null}
      </Section>

      {/* --- Season -------------------------------------------------------
          The section that makes the hour chart above honest. Where the peak
          hour moves between seasons, an annual figure is an average of two
          different behaviours and describes neither. */}
      {seasons.length ? (
        <Section
          title="How the year changes it"
          note="Volume by season, and the busiest hour within each season on its own. Seasons are whole calendar months, not solstice to solstice."
        >
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {seasons.map((s) => (
              <div key={s.season} className="rounded-xl border border-hairline bg-white px-4 py-3">
                <dt className="font-display text-lg font-bold text-[#101727]">
                  {SEASON_LABELS[s.season] ?? s.season}
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#98a0aa]">
                    {SEASON_MONTHS[s.season]}
                  </span>
                </dt>
                <dd className="mt-2 text-sm text-[#5b6472]">
                  <span className="tabular-nums text-[#101727]">{pct(s.share)}</span> of the year&rsquo;s flights
                </dd>
                <dd className="mt-1 text-sm text-[#5b6472]">
                  Busiest hour:{" "}
                  <span className="font-semibold text-[#101727]">
                    {s.peakHour === null ? "no flights" : hourLabel(s.peakHour)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {peakSpread ? (
            <p className="mt-5 text-[15px] leading-relaxed text-[#33383f]">
              The busiest hour moves by {peakSpread.hours} hour{peakSpread.hours === 1 ? "" : "s"} across the
              year — {hourLabel(peakSpread.earliest.peakHour!)} in{" "}
              {(SEASON_LABELS[peakSpread.earliest.season] ?? "").toLowerCase()} against{" "}
              {hourLabel(peakSpread.latest.peakHour!)} in{" "}
              {(SEASON_LABELS[peakSpread.latest.season] ?? "").toLowerCase()}. If you book the same slot
              year-round, you are not booking the same airport.
            </p>
          ) : null}

          {insights.byMonth.length > 1 ? (
            <div className="mt-8">
              <p className="text-sm text-[#5b6472]">Flights by month</p>
              <ol className="mt-3 grid h-28 items-end gap-[3px]" style={MONTH_GRID} aria-label="Flights by month">
                {insights.byMonth.map((m) => (
                  <li
                    key={m.month}
                    className="flex h-full flex-col justify-end"
                    title={`${MONTH_NAMES[m.month - 1]} — ${m.flights.toLocaleString("en-US")} flights (${pct(m.share)})`}
                  >
                    <span
                      className={`block w-full rounded-t-[4px] ${m.flights === peakMonthFlights ? "bg-brand" : "bg-brand-light"}`}
                      style={{ height: `${peakMonthFlights ? (m.flights / peakMonthFlights) * 100 : 0}%` }}
                    />
                  </li>
                ))}
              </ol>
              <div className="mt-2 grid gap-[3px] text-center text-[11px] text-[#5b6472]" style={MONTH_GRID}>
                {insights.byMonth.map((m) => (
                  <span key={m.month}>{MONTH_LABELS[m.month - 1]}</span>
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* --- Training intensity -------------------------------------------
          Replaces the runway section, which the data source cannot feed:
          FR24's flight-summary carries no runway at all, and deriving it
          would take one track call per flight. This asks a question the data
          answers directly instead of half-answering the one it can't. */}
      <Section
        title="How much of this is training"
        note="A local flight departed and returned here — a lesson, pattern work, or a trip to the practice area. The rest went somewhere else or came from somewhere else."
      >
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-hairline bg-white px-5 py-4">
            <p className="font-display text-[2.75rem] font-bold leading-none tabular-nums text-brand-dark">
              {pct(insights.localShare)}
            </p>
            <p className="mt-2 text-sm text-[#5b6472]">of flights departed and returned here</p>
          </div>
          {insights.medianLocalMinutes ? (
            <div className="rounded-xl border border-hairline bg-white px-5 py-4">
              <p className="font-display text-[2.75rem] font-bold leading-none tabular-nums text-brand-dark">
                {insights.medianLocalMinutes}
                <span className="ml-1 text-lg font-semibold text-[#5b6472]">min</span>
              </p>
              <p className="mt-2 text-sm text-[#5b6472]">median local flight, block to block</p>
            </div>
          ) : null}
        </div>

        {insights.localShare >= 0.5 ? (
          <p className="mt-5 text-[15px] leading-relaxed text-[#33383f]">
            More than half of everything here goes up and comes back to the same field. That is what a
            training airport looks like from the outside, and it is worth knowing before you plan a stop:
            the pattern is the busy part.
          </p>
        ) : null}

        {insights.topOperators.length ? (
          <div className="mt-8">
            <p className="text-sm text-[#5b6472]">Most active operators</p>
            <ol className="mt-3 flex flex-col divide-y divide-[#e9ebee]">
              {insights.topOperators.map((o) => (
                <li key={o.operator} className="flex items-baseline gap-4 py-2.5">
                  <span className="font-display text-lg font-bold text-[#101727]">{o.operator}</span>
                  <span className="ml-auto text-sm tabular-nums text-[#5b6472]">
                    {pct(o.share)} of flights
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-[#5b6472]">
              Callsign prefixes as filed. Flights without one — most privately owned aircraft — are counted in
              the totals above but not here.
            </p>
          </div>
        ) : null}
      </Section>

      {/* --- Destinations ------------------------------------------------- */}
      {insights.commonDestinations.length ? (
        <Section
          title="Where people go from here"
          note="Most common destinations on recorded departures. A reasonable shortlist for a first cross-country."
        >
          <ol className="mt-5 flex flex-col divide-y divide-[#e9ebee]">
            {insights.commonDestinations.map((d, i) => (
              <li key={d.airport} className="flex items-baseline gap-4 py-2.5">
                <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-brand">{i + 1}</span>
                <span className="font-display text-lg font-bold text-[#101727]">{d.airport}</span>
                <span className="ml-auto text-sm tabular-nums text-[#5b6472]">
                  {d.flights.toLocaleString("en-US")} departures
                </span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* --- Where the flying happens -------------------------------------
          Deliberately not "what the pattern looks like": every pattern is a
          rectangle, and drawing one here would tell a student nothing they
          don't already know. What differs field to field is where people go
          once they leave it.

          Real tracks only. An illustrated version of this figure would be
          the same failure as an unsourced statistic and much harder to spot,
          so the section renders an empty state rather than a drawing. */}
      <Section
        title="Where the flying actually happens"
        note="Every local flight in the sample, drawn over each other. Where the lines pile up is where aircraft from this field spend their time — the practice areas, the corridor out, and how far the pattern really extends."
      >
        {tracks.length ? (
          <TrackDensityMap
            tracks={tracks.map((points) => ({ points }))}
            center={
              airport.latitude !== null && airport.longitude !== null
                ? { lat: airport.latitude, lon: airport.longitude }
                : null
            }
            label={`Ground tracks of ${tracks.length} local flights at ${airport.ident}`}
          />
        ) : (
          <div className="mt-5 flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 text-center">
            <p className="text-sm text-[#4f5560]">No published tracks for this field yet.</p>
            <p className="max-w-md text-xs leading-relaxed text-[#5b6472]">
              This is drawn from real ADS-B position history, never illustrated. It is the local knowledge a
              transferring student can&rsquo;t get from a chart: where everyone actually goes for airwork, and the
              corridor they take to get there.
            </p>
          </div>
        )}
      </Section>

      {/* --- Method ------------------------------------------------------- */}
      <Section title="How this was measured">
        <div className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-[#33383f]">
          <p>
            Each figure counts one flight, not one movement. A lesson that departs, flies a dozen
            touch-and-goes and lands is one flight here, because that is what the data source records. Any
            page reporting these as &ldquo;operations&rdquo; would be overstating them several times over.
          </p>
          <p>
            Flights are classified by which ends touched this field: local when it departed and returned here,
            otherwise a departure or an arrival. A departure is timed from its takeoff and an arrival from its
            landing, so an evening arrival is not filed under a morning departure time from elsewhere.
          </p>
          <p>
            Hours, days and months are local to the field. Destinations are counted from departures only, so a
            round trip counts once rather than twice. Median local duration is a median rather than an average
            because one ferry flight would drag a mean badly.
          </p>
          <p>
            Seasons are whole calendar months — December through February is winter — because that is what
            training activity tracks and what a reader can check. Each season&rsquo;s busiest hour is computed
            within that season alone, not read off the annual chart.
          </p>
          <p>
            The track figure is a sample of local flights spread across hours and months, not every flight and
            not the most recent ones — the most recent few hundred would be one week of one season and would
            draw a map of that week. Individual flights are not identified, and the registrations and
            timestamps that would identify them are not stored.
          </p>
          <p>
            Figures are recomputed on a schedule over a rolling window and stored. Nothing on this page is
            calculated when you load it, which is why the window and the computation date are stated above.
          </p>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-hairline pt-10">
      <h2 className="font-display text-2xl font-bold text-[#101727]">{title}</h2>
      {note ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5b6472]">{note}</p> : null}
      {children}
    </section>
  );
}
