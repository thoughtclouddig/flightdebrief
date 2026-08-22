import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Real comments about flight-training debriefs -- evidence this is a known
 * problem, not endorsements of AfterFlight. LOCKED CONTENT: quote text and
 * attribution have already been researched/selected/approved -- do not
 * rewrite, shorten, expand, reorder, or add to them. Only their visual
 * presentation (card size, scroll speed) should change. No source URLs were
 * supplied (only publication/subreddit names), so `source` renders as plain
 * text rather than a guessed link.
 */
const QUOTES = [
  {
    snippet: "rushed, informal, or skipped altogether",
    highlight: "skipped altogether",
    attribution: "AOPA",
    source: null,
    emphasis: true,
  },
  {
    snippet: "Some students enter every lesson blind.",
    highlight: "enter every lesson blind",
    attribution: "Pilot",
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "My instructor never did debriefs with me",
    highlight: "never did debriefs",
    attribution: "Student Pilot",
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "debriefs are just an oral discussion",
    highlight: "just an oral discussion",
    attribution: "Pilot",
    source: "r/CFILounge",
    emphasis: false,
  },
  {
    snippet: "retain information, even when it's recent",
    highlight: "even when it's recent",
    attribution: "CFI",
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "I feel lost tracking my progress",
    highlight: "feel lost",
    attribution: "Student Pilot",
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "kept showing up across multiple flights",
    highlight: "across multiple flights",
    attribution: "Student Pilot",
    source: "r/flying",
    emphasis: false,
  },
] as const;

/** The three connected failures this section walks through, left to right. */
const PROBLEMS = [
  { number: "01", label: "Inconsistent", detail: "Some debriefs are rushed, vague, or skipped." },
  { number: "02", label: "Forgotten", detail: "Details fade before the next lesson." },
  { number: "03", label: "Disconnected", detail: "Nothing carries forward." },
] as const;

function HighlightedSnippet({ text, highlight }: { text: string; highlight: string }) {
  const start = text.indexOf(highlight);
  if (start === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <span className="text-brand">{text.slice(start, start + highlight.length)}</span>
      {text.slice(start + highlight.length)}
    </>
  );
}

function ProblemSequence() {
  return (
    <div className="mx-auto mt-16 flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-start sm:gap-3">
      {PROBLEMS.map((p) => (
        <div key={p.number} className="flex gap-4 sm:flex-1 sm:flex-col sm:gap-0 sm:text-center">
          <div className="flex flex-col items-start sm:items-center">
            <span
              className="text-sm font-bold tracking-[0.08em] text-brand"
              style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
            >
              {p.number}
            </span>
            <p
              className="font-display mt-1 text-lg font-bold text-[#101727]"
              style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
            >
              {p.label}
            </p>
          </div>
          <p
            className="text-pretty mt-1 text-sm leading-relaxed text-[#4b545d] sm:mx-auto sm:max-w-[13rem]"
            style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
          >
            {p.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function QuoteRail() {
  return (
    <div className="relative mt-8 -mx-6 overflow-hidden">
      {/* Content is duplicated so the loop point (-50%) is seamless, same technique as ppl-payoff.tsx's photo marquee. */}
      <div className="flex w-max animate-[marquee-slide_75s_linear_infinite] gap-4 px-6 hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[...QUOTES, ...QUOTES].map((q, i) => (
          <div
            key={i}
            className={`w-72 shrink-0 rounded-lg border bg-white p-5 text-left shadow-sm ${
              q.emphasis ? "border-brand/30" : "border-slate-200"
            }`}
          >
            <p className="font-display text-pretty text-xl font-bold leading-snug text-[#101727]">
              &ldquo;
              <HighlightedSnippet text={q.snippet} highlight={q.highlight} />
              &rdquo;
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-[#101727]">{q.attribution}</p>
              {q.source ? (
                <span
                  className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${q.emphasis ? "text-brand" : "text-[#8c97a2]"}`}
                >
                  {q.source}
                </span>
              ) : null}
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
          className="text-balance text-lg font-bold uppercase tracking-[0.2em] text-brand sm:text-xl"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          Pilots know the problem
        </p>

        <p className="font-display mt-6 text-balance text-3xl font-bold leading-[1.05] text-[#101727] sm:text-[clamp(3rem,2.25rem+3vw,4.5rem)] sm:leading-[0.95]">
          Too much of the debrief <span className="text-brand">gets lost.</span>
        </p>
        <p
          className="mx-auto mt-8 max-w-md text-balance text-lg text-[#4b545d] sm:max-w-2xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          Every flight ends with a conversation that matters. But there&rsquo;s no guarantee the right things get
          discussed, remembered, or carried into the next lesson.
        </p>
      </Reveal>

      <Reveal delay={100} className="relative w-full">
        <ProblemSequence />
      </Reveal>

      <Reveal delay={300} className="relative mt-16 w-full">
        <p
          className="font-display mx-auto max-w-2xl text-balance text-center text-xl font-bold leading-snug text-[#101727] sm:whitespace-nowrap sm:text-2xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          You&rsquo;re not the only one asking for something better.
        </p>
        <QuoteRail />
      </Reveal>

      <Reveal delay={350} className="relative flex flex-col items-center">
        <a
          href="#how-it-works"
          className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-brand shadow-[0_2px_12px_rgba(240,118,33,0.12)] transition-colors hover:border-brand/50"
        >
          See how we solve it
          <ArrowDown className="size-4 animate-bounce" />
        </a>
      </Reveal>
    </section>
  );
}
