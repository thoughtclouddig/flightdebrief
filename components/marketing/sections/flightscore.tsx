import { Gauge, MessageCircle, Navigation as NavigationIcon, Brain, ClipboardCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SlideInRight } from "@/components/marketing/slide-in-right";
import { FlightScoreGauge } from "@/components/flight-score/flight-score-gauge";
import { mockFlightScoreOnTrack } from "@/components/flight-score/mock-data";

const CATEGORY_ICONS: Record<string, typeof Gauge> = {
  "Aircraft Control": Gauge,
  Procedures: ClipboardCheck,
  Navigation: NavigationIcon,
  Communication: MessageCircle,
  "Decision Making": Brain,
};

const TONE_TEXT_CLASS = {
  good: "text-[#2f7a4e]",
  amber: "text-[#b87621]",
  danger: "text-[#c0362b]",
} as const;

/**
 * Marketing showcase only -- score/categories below are the same
 * components/flight-score/mock-data.ts fixture the app itself uses for
 * demos, never real user data. The in-app version of this component (see
 * app/(product)/progress/page.tsx) shows an honest "not available yet" state
 * instead, since real scoring methodology doesn't exist yet.
 */
export function FlightScoreSection() {
  const data = mockFlightScoreOnTrack;

  return (
    <section id="flightscore" className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Training Progress, Not a Grade</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            See progress across flights and skill areas.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            AfterFlight Score builds on your debrief history &mdash; every observation, action item, and
            instructor note &mdash; into a simple view of your progress across the skills that matter most.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center lg:gap-20">
          <Reveal className="flex flex-col items-center">
            <div className="sm:hidden">
              <FlightScoreGauge score={data.score} label={data.label} tone={data.tone} size={260} />
            </div>
            <div className="hidden sm:block">
              <FlightScoreGauge score={data.score} label={data.label} tone={data.tone} size={440} />
            </div>
            <p className="mt-4 max-w-[280px] text-balance text-center text-xs text-[#68717D]">
              Built from structured, instructor-reviewed observations across your training &mdash; not an AI grade
              of a single flight.
            </p>
          </Reveal>

          <div className="flex w-full max-w-md flex-col divide-y divide-[#c7ccd1]/60">
            {data.categories?.map((category, i) => {
              const Icon = CATEGORY_ICONS[category.label] ?? Gauge;
              return (
                <SlideInRight key={category.label} delay={150 + i * 90} className="flex items-center gap-5 py-5">
                  <Icon className={`size-7 shrink-0 ${TONE_TEXT_CLASS[category.tone]}`} />
                  <span className="flex-1 text-lg font-medium text-[#101727]">{category.label}</span>
                  <span className="font-display w-12 text-right text-xl font-bold text-[#101727]">{category.score}</span>
                </SlideInRight>
              );
            })}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-lg text-balance text-center text-xs text-[#68717D]/70">
          AfterFlight Score is a simple way to see your training progress. It doesn&rsquo;t certify proficiency,
          determine safety or checkride readiness, or replace your instructor&rsquo;s judgment.
        </p>
      </div>
    </section>
  );
}
