import { ClipboardList, Repeat, Search } from "lucide-react";
import { InsightStatCard } from "@/components/insight-stat-card";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_INSIGHTS } from "@/lib/marketing/demo-data";

export function TrainingInsights() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Training insights</p>
        <h2 className="font-display mt-3 max-w-2xl text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
          See patterns before they become problems.
        </h2>
        <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-foreground-soft">
          FlightBrief surfaces patterns worth reviewing. Chief instructors make the call.
        </p>
      </Reveal>

      <Reveal delay={150} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InsightStatCard
          icon={Repeat}
          iconClassName="text-amber-500"
          title="Recurring Deficiencies"
          value={DEMO_INSIGHTS.recurringDeficiencies}
          description="students with the same deficiency across 3+ lessons."
          linkLabel="View"
          href="/app"
        />
        <InsightStatCard
          icon={ClipboardList}
          title="Carried Forward"
          value={DEMO_INSIGHTS.carriedForward}
          description="students with an objective carried forward repeatedly."
          linkLabel="View"
          href="/app"
        />
        <InsightStatCard
          icon={Search}
          title="Coverage Gaps"
          value={DEMO_INSIGHTS.coverageGaps}
          description="students with a possible training coverage gap."
          linkLabel="View"
          href="/app"
        />
      </Reveal>
    </section>
  );
}
