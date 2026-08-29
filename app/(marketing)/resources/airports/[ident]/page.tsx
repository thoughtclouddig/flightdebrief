import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/data";
import { isContentPublic } from "@/lib/content/visibility";
import { appOrigin } from "@/lib/email";
import type { AirportInsightsRecord } from "@/lib/types";

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
  props: PageProps<"/resources/airports/[ident]">,
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
    description: `Operations at ${airport.name} (${airport.ident}) by hour and day, runway use, and common destinations, from ${insights.sampleSize.toLocaleString("en-US")} recorded operations.`,
    alternates: origin ? { canonical: `${origin}/resources/airports/${airport.ident.toLowerCase()}` } : undefined,
    // A provisional report must never be indexed. Doing this in metadata
    // rather than a robots.txt rule keeps the decision next to the data that
    // drives it, so it can't be left behind when the data changes.
    robots: isProvisional(insights) ? { index: false, follow: false } : undefined,
  };
}

export default async function AirportReportPage(props: PageProps<"/resources/airports/[ident]">) {
  if (!isContentPublic()) notFound();

  const { ident } = await props.params;
  const repo = getRepository();
  const [airport, insights] = await Promise.all([
    repo.getAirport(ident),
    repo.getAirportInsights(ident),
  ]);

  // No insights row means the airport never cleared the sample floor. That is
  // a 404 rather than an "insufficient data" page on purpose: a page whose
  // only content is an apology is still a thin page.
  if (!airport || !insights) notFound();

  const provisional = isProvisional(insights);
  const hours = insights.busiestHours;
  const peakHourOps = hours.length ? Math.max(...hours.map((h) => h.operations)) : 0;
  const byHour = [...hours].sort((a, b) => a.hour - b.hour);
  const quietest = [...hours].filter((h) => h.operations > 0).sort((a, b) => a.operations - b.operations)[0];
  const busiestDay = insights.busiestDays[0];
  const quietestDay = insights.busiestDays[insights.busiestDays.length - 1];
  const topRunway = insights.runwayUse[0];
  const seasons = insights.bySeason.filter((s) => s.operations > 0);
  const peakMonthOps = insights.byMonth.length ? Math.max(...insights.byMonth.map((m) => m.operations)) : 0;

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
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
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

      <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-[#68717D]">
        <Link href="/resources" className="hover:underline">Resources</Link>
        <span className="px-2">/</span>Airport reports
      </p>

      <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] text-[#101727]">
        {airport.ident}: when it&rsquo;s busy, which runway, and where people go
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[#3d4653]">
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
      <p className="mt-6 rounded-lg border border-hairline bg-[#fafafb] px-4 py-3 text-sm text-[#56636f]">
        Based on <strong className="font-semibold text-[#101727]">{insights.sampleSize.toLocaleString("en-US")}</strong>{" "}
        operations recorded between {windowLabel(insights.windowStart)} and {windowLabel(insights.windowEnd)}
        {insights.sources.length ? <> · source: {insights.sources.join(", ")}</> : null}
        {" · "}last computed {new Date(insights.computedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
      </p>

      {/* --- Hour of day ------------------------------------------------- */}
      <Section
        title="When the field is busy"
        note="Share of all recorded operations by local hour."
      >
        <ol className="mt-6 grid h-52 items-end gap-[3px]" style={HOUR_GRID} aria-label="Operations by local hour">
          {byHour.map((h) => {
            const height = peakHourOps ? (h.operations / peakHourOps) * 100 : 0;
            const isPeak = h.operations === peakHourOps && peakHourOps > 0;
            return (
              <li
                key={h.hour}
                className="flex h-full flex-col justify-end"
                title={`${hourLabel(h.hour)} — ${h.operations.toLocaleString("en-US")} operations (${pct(h.share)})`}
              >
                {isPeak ? (
                  <span className="mb-1 text-center text-[11px] font-bold tabular-nums text-[#101727]">
                    {pct(h.share)}
                  </span>
                ) : null}
                <span
                  className={`block w-full rounded-t-[4px] ${isPeak ? "bg-[#101727]" : "bg-[#c7ccd4]"}`}
                  style={{ height: `${Math.max(height, h.operations > 0 ? 2 : 0)}%` }}
                />
              </li>
            );
          })}
        </ol>
        {/* Ticks share the bars' grid rather than being spaced by
            justify-between. They didn't before, so every label sat up to two
            hours off its bar -- a chart that reads the peak at the wrong hour
            is worse than no chart. */}
        <div className="mt-2 grid gap-[3px] text-[11px] tabular-nums text-[#68717D]" style={HOUR_GRID}>
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
      <Section title="Which days" note="Share of all recorded operations by day of week.">
        <dl className="mt-5 flex flex-col gap-2.5">
          {[...insights.busiestDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((d) => (
            <div key={d.dayOfWeek} className="flex items-center gap-4">
              <dt className="w-24 shrink-0 text-sm text-[#56636f]">{DAY_NAMES[d.dayOfWeek]}</dt>
              <dd className="flex flex-1 items-center gap-3">
                <span
                  className={`block h-2.5 rounded-full ${d.dayOfWeek === busiestDay?.dayOfWeek ? "bg-[#101727]" : "bg-[#c7ccd4]"}`}
                  style={{ width: `${(d.share / (busiestDay?.share || 1)) * 100}%` }}
                />
                <span className="shrink-0 text-sm tabular-nums text-[#68717D]">{pct(d.share)}</span>
              </dd>
            </div>
          ))}
        </dl>
        {busiestDay && quietestDay && busiestDay.dayOfWeek !== quietestDay.dayOfWeek ? (
          <p className="mt-5 text-[15px] leading-relaxed text-[#3d4653]">
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
              <div key={s.season} className="rounded-xl border border-hairline bg-[#fafafb] px-4 py-3">
                <dt className="font-display text-lg font-bold text-[#101727]">
                  {SEASON_LABELS[s.season] ?? s.season}
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#a0a7b0]">
                    {SEASON_MONTHS[s.season]}
                  </span>
                </dt>
                <dd className="mt-2 text-sm text-[#68717D]">
                  <span className="tabular-nums text-[#101727]">{pct(s.share)}</span> of the year&rsquo;s operations
                </dd>
                <dd className="mt-1 text-sm text-[#68717D]">
                  Busiest hour:{" "}
                  <span className="font-semibold text-[#101727]">
                    {s.peakHour === null ? "no operations" : hourLabel(s.peakHour)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {peakSpread ? (
            <p className="mt-5 text-[15px] leading-relaxed text-[#3d4653]">
              The busiest hour moves by {peakSpread.hours} hour{peakSpread.hours === 1 ? "" : "s"} across the
              year — {hourLabel(peakSpread.earliest.peakHour!)} in{" "}
              {(SEASON_LABELS[peakSpread.earliest.season] ?? "").toLowerCase()} against{" "}
              {hourLabel(peakSpread.latest.peakHour!)} in{" "}
              {(SEASON_LABELS[peakSpread.latest.season] ?? "").toLowerCase()}. If you book the same slot
              year-round, you are not booking the same airport.
            </p>
          ) : null}

          {insights.byMonth.length ? (
            <div className="mt-8">
              <p className="text-sm text-[#68717D]">Operations by month</p>
              <ol className="mt-3 grid h-28 items-end gap-[3px]" style={MONTH_GRID} aria-label="Operations by month">
                {insights.byMonth.map((m) => (
                  <li
                    key={m.month}
                    className="flex h-full flex-col justify-end"
                    title={`${MONTH_NAMES[m.month - 1]} — ${m.operations.toLocaleString("en-US")} operations (${pct(m.share)})`}
                  >
                    <span
                      className={`block w-full rounded-t-[4px] ${m.operations === peakMonthOps ? "bg-[#101727]" : "bg-[#c7ccd4]"}`}
                      style={{ height: `${peakMonthOps ? (m.operations / peakMonthOps) * 100 : 0}%` }}
                    />
                  </li>
                ))}
              </ol>
              <div className="mt-2 grid gap-[3px] text-center text-[11px] text-[#68717D]" style={MONTH_GRID}>
                {insights.byMonth.map((m) => (
                  <span key={m.month}>{MONTH_LABELS[m.month - 1]}</span>
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* --- Runways ------------------------------------------------------ */}
      <Section
        title="Which runway you&rsquo;ll actually get"
        note="Share of operations by runway. Often not the runway the wind alone would suggest — noise abatement, terrain, and habit all move it."
      >
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {insights.runwayUse.map((r) => (
            <div key={r.runway} className="rounded-xl border border-hairline bg-[#fafafb] px-4 py-3">
              <dt className="font-display text-2xl font-bold tabular-nums text-[#101727]">{r.runway}</dt>
              <dd className="mt-1 text-sm text-[#68717D]">
                <span className="tabular-nums">{pct(r.share)}</span> of operations
                <span className="text-[#a0a7b0]"> · {r.operations.toLocaleString("en-US")}</span>
              </dd>
            </div>
          ))}
        </dl>
        {topRunway ? (
          <p className="mt-5 text-[15px] leading-relaxed text-[#3d4653]">
            Runway {topRunway.runway} takes {pct(topRunway.share)} of everything that moves here. If you&rsquo;ve
            only ever flown the pattern one direction at this field, that&rsquo;s why.
          </p>
        ) : null}
      </Section>

      {/* --- Destinations ------------------------------------------------- */}
      {insights.commonDestinations.length ? (
        <Section
          title="Where people go from here"
          note="Most common destinations on recorded departures. A reasonable shortlist for a first cross-country."
        >
          <ol className="mt-5 flex flex-col divide-y divide-[#eceef1]">
            {insights.commonDestinations.map((d, i) => (
              <li key={d.airport} className="flex items-baseline gap-4 py-2.5">
                <span className="w-6 shrink-0 text-sm tabular-nums text-[#a0a7b0]">{i + 1}</span>
                <span className="font-display text-lg font-bold text-[#101727]">{d.airport}</span>
                <span className="ml-auto text-sm tabular-nums text-[#68717D]">
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
          once they leave it. Rendering an honest empty state rather than an
          illustration -- a drawn track that isn't a real track is the same
          failure as an unsourced statistic and harder to spot. */}
      <Section
        title="Where the flying actually happens"
        note="Which practice areas get used, which way traffic leaves the field, and how far the pattern gets pushed by terrain and airspace."
      >
        <div className="mt-5 flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 text-center">
          <p className="text-sm text-[#56636f]">No published tracks for this field yet.</p>
          <p className="max-w-md text-xs leading-relaxed text-[#68717D]">
            This is drawn from real ADS-B position history, never illustrated. It is the local knowledge a
            transferring student can&rsquo;t get from a chart: where everyone actually goes for airwork, and the
            corridor they take to get there.
          </p>
        </div>
      </Section>

      {/* --- Method ------------------------------------------------------- */}
      <Section title="How this was measured">
        <div className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-[#3d4653]">
          <p>
            Each operation is one movement: an arrival, a departure, or a lap in the pattern. Pattern work is
            counted separately from arrivals and departures, because a touch-and-go is neither, and conflating
            them is what makes most published pattern counts wrong.
          </p>
          <p>
            Hours and days are local to the field. Destinations are counted from departures only, so a round
            trip counts once rather than twice.
          </p>
          <p>
            Seasons are whole calendar months — December through February is winter — because that is what
            training activity tracks and what a reader can check. Each season&rsquo;s busiest hour is computed
            within that season alone, not read off the annual chart.
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
    <section className="mt-12 border-t border-hairline pt-8">
      <h2 className="font-display text-2xl font-bold text-[#101727]">{title}</h2>
      {note ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#68717D]">{note}</p> : null}
      {children}
    </section>
  );
}
