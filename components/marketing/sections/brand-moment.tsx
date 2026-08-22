import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Real comments about flight-training debriefs, shortened to a punchy
 * excerpt of the original -- evidence this is a known problem, not
 * endorsements of AfterFlight. `snippet`/`highlight` are genuine contiguous
 * substrings of the full quote, never invented text. No source URLs were
 * supplied (only publication/subreddit names), so `source` renders as plain
 * text rather than a guessed link -- add `href` per quote once real links
 * are available.
 */
const QUOTES = [
  {
    snippet: "rushed, informal, or skipped altogether",
    highlight: "skipped altogether",
    attribution: "Brandon Williams",
    role: "Former U.S. Air Force fighter pilot, instructor & aviation safety officer",
    source: "AOPA",
    emphasis: true,
  },
  {
    snippet: "between lessons I feel a bit lost",
    highlight: "feel a bit lost",
    attribution: "Student Pilot",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "never did debriefs with me",
    highlight: "never did debriefs",
    attribution: "Student Pilot",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "TAKE. NOTES. Keep them on every student.",
    highlight: "TAKE. NOTES.",
    attribution: "CFI",
    role: null,
    source: "r/flying",
    emphasis: false,
  },
  {
    snippet: "shows up knowing exactly what happened",
    highlight: "knowing exactly what happened",
    attribution: "Student Pilot",
    role: null,
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
    <div className="relative mt-14 -mx-6 overflow-hidden">
      {/* Content is duplicated so the loop point (-50%) is seamless, same technique as ppl-payoff.tsx's photo marquee. */}
      <div className="flex w-max animate-[marquee-slide_38s_linear_infinite] gap-4 px-6 hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[...QUOTES, ...QUOTES].map((q, i) => (
          <div
            key={i}
            className={`w-64 shrink-0 rounded-lg border bg-white p-5 text-left shadow-sm sm:w-72 ${
              q.emphasis ? "border-brand/30" : "border-slate-200"
            }`}
          >
            <p className="font-display text-pretty text-xl font-bold leading-snug text-[#101727]">
              &ldquo;
              <HighlightedSnippet text={q.snippet} highlight={q.highlight} />
              &rdquo;
            </p>
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
          className="text-balance text-base font-bold uppercase tracking-[0.2em] text-brand sm:text-lg"
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
          You land. You talk it through. Your instructor tells you what worked, what didn&rsquo;t, and what to
          fix next time. Then the details start to&nbsp;fade.
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
