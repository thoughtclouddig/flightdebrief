import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Real comments/quotes about flight-training debriefs, gathered as evidence
 * this is a known problem -- not endorsements of AfterFlight itself. No
 * source URLs were supplied for these (only publication/subreddit names), so
 * `source` renders as plain text rather than a guessed link -- add `href` per
 * quote once real links are available.
 */
const QUOTES = [
  {
    quote: "Too often in general aviation, this critical part of flight training is rushed, informal, or skipped altogether.",
    attribution: "Brandon Williams",
    role: "Former U.S. Air Force fighter pilot, instructor & aviation safety officer",
    source: "AOPA",
    emphasis: true,
  },
  {
    quote: "My instructor gives feedback, but between lessons I feel a bit lost in terms of tracking progress.",
    attribution: "Student Pilot",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
  {
    quote: "My instructor never did debriefs with me or went over with me to review what I have learned during my lesson.",
    attribution: "Student Pilot",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
  {
    quote: "TAKE. NOTES. Keep them on every student, after every lesson. Helps you and helps them.",
    attribution: "CFI",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
  {
    quote:
      "I'm always so impressed when my instructor shows up knowing exactly what happened in the last lesson weeks ago, my current skills, and with a plan to work on it.",
    attribution: "Student Pilot",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
] as const;

function QuoteRail() {
  return (
    <div className="relative mx-auto mt-14 w-full sm:max-w-4xl">
      <p className="text-balance text-center text-xs font-bold uppercase tracking-[0.16em] text-[#8c97a2]">
        Pilots know the problem
      </p>
      <div
        className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {QUOTES.map((q, i) => (
          <div
            key={i}
            className={`w-[82%] shrink-0 snap-start rounded-lg border bg-white p-5 text-left shadow-sm sm:w-72 lg:w-80 ${
              q.emphasis ? "border-brand/30" : "border-slate-200"
            }`}
          >
            <p className="text-pretty text-sm leading-relaxed text-[#101727]">&ldquo;{q.quote}&rdquo;</p>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-xs font-semibold text-[#101727]">{q.attribution}</p>
                {q.role ? <p className="mt-0.5 text-[11px] text-[#8c97a2]">{q.role}</p> : null}
              </div>
              <span
                className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${q.emphasis ? "text-brand" : "text-[#8c97a2]"}`}
              >
                {q.source}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandMoment() {
  return (
    <section className="relative flex min-h-[560px] flex-col items-center overflow-hidden bg-white px-6 py-20 sm:min-h-[680px] sm:py-24 lg:min-h-[860px]">
      <div className="absolute inset-0">
        <Image
          src="/images/marketing/ten-minutes-back.webp"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 55%", filter: "saturate(0.65) brightness(1.12)" }}
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.97) 22%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.88) 68%, rgba(255,255,255,0.5) 85%, rgba(255,255,255,0.08) 100%)",
          }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <p
          className="text-balance text-xs font-bold uppercase tracking-[0.2em] text-brand"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          The Problem
        </p>

        <p className="font-display mt-6 text-balance text-3xl font-bold leading-[1.05] text-[#101727] sm:text-[clamp(3rem,2.25rem+3vw,4.5rem)] sm:leading-[0.95]">
          Too much of the debrief <span className="text-brand">gets lost.</span>
        </p>
        <p
          className="mx-auto mt-8 max-w-md text-balance text-lg text-[#4b545d] sm:max-w-2xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          You land. You talk it through. Your instructor tells you what worked, what didn&rsquo;t, and what to
          fix next time. Then the details start to&nbsp;fade.
        </p>

        <p
          className="mx-auto mt-10 max-w-sm text-pretty text-base font-semibold text-[#101727]"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          It doesn&rsquo;t have to disappear when you leave the airplane.
        </p>

        <a
          href="#how-it-works"
          className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-white/70 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-brand shadow-[0_2px_12px_rgba(240,118,33,0.12)] backdrop-blur-sm transition-colors hover:border-brand/50 hover:bg-white"
        >
          See how we solve it
          <ArrowDown className="size-4 animate-bounce" />
        </a>
      </Reveal>

      <Reveal delay={150} className="relative w-full">
        <QuoteRail />
      </Reveal>
    </section>
  );
}
