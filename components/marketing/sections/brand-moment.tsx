import Image from "next/image";
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
    snippet: "this critical part of flight training is rushed, informal, or skipped altogether",
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
    snippet: "Most flight instructor debriefs are just an oral discussion.",
    highlight: "just an oral discussion",
    attribution: "Pilot",
    source: "r/CFILounge",
    emphasis: false,
  },
  {
    snippet: "Students don't always retain information, even when it's recent",
    highlight: "even when it's recent",
    attribution: "CFI",
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "Between lessons, I feel lost tracking my progress.",
    highlight: "feel lost",
    attribution: "Student Pilot",
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "The same issue kept showing up across multiple flights.",
    highlight: "across multiple flights",
    attribution: "Student Pilot",
    source: "r/flying",
    emphasis: false,
  },
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

function QuoteRail() {
  return (
    <div className="relative mt-8 -mx-6 overflow-hidden">
      {/* Content is duplicated so the loop point (-50%) is seamless, same technique as ppl-payoff.tsx's photo marquee. */}
      <div className="flex w-max animate-[marquee-slide_75s_linear_infinite] gap-4 px-6 hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[...QUOTES, ...QUOTES].map((q, i) => (
          <div
            key={i}
            className={`w-80 shrink-0 rounded-lg border bg-white p-4 text-left shadow-sm ${
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
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 22%, rgba(255,255,255,0.72) 48%, rgba(255,255,255,0.55) 68%, rgba(255,255,255,0.3) 85%, rgba(255,255,255,0.05) 100%)",
          }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <p
          className="text-balance text-lg font-bold uppercase tracking-[0.2em] text-brand sm:text-xl"
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
          Every flight ends with a conversation that matters. But there&rsquo;s no guarantee the right things get
          discussed, remembered, or carried into the next lesson.
        </p>
      </Reveal>

      <Reveal delay={300} className="relative mt-16 w-full">
        <p
          className="font-display mx-auto max-w-2xl text-balance text-center text-lg font-bold leading-snug text-[#101727] sm:whitespace-nowrap sm:text-xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          You&rsquo;re not the only one who sees <span className="text-brand">the problem.</span>
        </p>
        <QuoteRail />
      </Reveal>
    </section>
  );
}
