import { Gauge, MessageCircle, Navigation as NavigationIcon, Brain, ClipboardCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SlideInRight } from "@/components/marketing/slide-in-right";
import { MarketingFlightScoreGauge } from "@/components/marketing/marketing-flight-score-gauge";
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

const TREND_INDICATORS: Record<string, { text: string; dotClass: string }> = {
  "Aircraft Control": { text: "Improving", dotClass: "bg-[#2f7a4e]" },
  Procedures: { text: "Consistent", dotClass: "bg-[#3b6fb6]" },
  Navigation: { text: "Focus Area", dotClass: "bg-[#c0362b]" },
  Communication: { text: "Strong", dotClass: "bg-[#2f7a4e]" },
  "Decision Making": { text: "Improving", dotClass: "bg-[#2f7a4e]" },
};

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
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">Your Training, Over Time</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            See what&rsquo;s improving.
            <br />
            Know what needs work.
          </h2>
          <p className="mt-4 text-pretty text-lg text-[#414B57]">
            AfterFlight turns your instructor-reviewed debriefs into a clear picture of your training over time
            &mdash; showing where you&rsquo;re improving, where you&rsquo;re consistent, and what deserves
            attention next.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center lg:gap-20">
          <Reveal className="flex flex-col items-center">
            <MarketingFlightScoreGauge
              score={data.score}
              label={data.label}
              tone={data.tone}
              caption="Last 8 flights"
            />
            <p className="mt-4 max-w-[320px] text-balance text-center text-sm text-[#414B57]">
              Built from structured, instructor-reviewed observations across your training &mdash; not an AI grade
              of a single flight.
            </p>
          </Reveal>

          <div className="flex w-full max-w-md flex-col divide-y divide-[#c7ccd1]/60">
            {data.categories?.map((category, i) => {
              const Icon = CATEGORY_ICONS[category.label] ?? Gauge;
              const trend = TREND_INDICATORS[category.label];
              return (
                <SlideInRight key={category.label} delay={150 + i * 90} className="flex items-center gap-5 py-5">
                  <Icon className={`size-7 shrink-0 ${TONE_TEXT_CLASS[category.tone]}`} />
                  <span className="text-pretty flex-1 text-lg font-medium text-[#101727]">{category.label}</span>
                  {trend ? (
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#101727]">
                      <span className={`size-2.5 shrink-0 rounded-full ${trend.dotClass}`} aria-hidden="true" />
                      {trend.text}
                    </span>
                  ) : null}
                </SlideInRight>
              );
            })}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-lg text-balance text-center text-xs text-[#414B57]/70">
          AfterFlight tracks training progress and patterns. It does not determine proficiency, certification,
          checkride readiness, or replace your instructor&rsquo;s judgment.
        </p>
      </div>
    </section>
  );
}
