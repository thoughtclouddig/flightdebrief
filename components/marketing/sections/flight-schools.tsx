import { AdminStat } from "@/components/admin-stat";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/marketing/count-up";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_SCHOOL_STATS, DEMO_TOP_ISSUES } from "@/lib/marketing/demo-data";

export function FlightSchools() {
  return (
    <section id="schools" className="border-t border-hairline bg-surface-sunken px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">For flight schools</p>
          <h2 className="font-display mt-3 max-w-2xl text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
            See where students keep getting stuck.
          </h2>
          <p className="mt-5 max-w-md text-balance text-[17px] leading-relaxed text-foreground-soft">
            Every debrief adds to a clearer picture of how training is going, across every student and every CFI.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DEMO_SCHOOL_STATS.map((stat) => (
            <AdminStat key={stat.label} label={stat.label} value={<CountUp value={stat.value} suffix={stat.suffix} />} />
          ))}
        </Reveal>

        <Reveal delay={250} className="mt-6">
          <Card>
            <CardContent>
              <p className="text-balance mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                What students are working on
              </p>
              <ul className="flex flex-col gap-2.5">
                {DEMO_TOP_ISSUES.map((issue) => (
                  <li key={issue.label} className="flex items-center justify-between text-sm">
                    <span className="text-balance text-foreground">{issue.label}</span>
                    <span className="font-medium text-foreground-soft">{issue.studentCount} students</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
