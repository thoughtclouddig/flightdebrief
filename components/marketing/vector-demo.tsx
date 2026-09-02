"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Vector card, playing out what happens when you pick a prompt.
 *
 * A static list of example prompts describes the feature; it doesn't show the
 * thing that actually distinguishes Vector, which is what comes BACK. The
 * answer is attributed to the instructor by name, grounded in a named FAA
 * source, and ends in one action -- none of which a generic assistant can do,
 * and none of which is visible until you see a response.
 *
 * It plays on its own so a scrolling visitor sees the payoff without clicking,
 * and any click takes over. Reduced motion skips the thinking beat and the
 * auto-advance entirely.
 */
const ANSWERS = [
  {
    prompt: "Explain what my instructor meant",
    title: "Why you're floating",
    evidence: { who: "Jake noticed", quote: "You were carrying too much speed into the flare." },
    body: "Extra speed carries farther into the flare and makes the touchdown point harder to control.",
    points: ["Stabilize earlier", "Hold your target airspeed", "Don't fix speed at the threshold"],
    action: "Check my understanding",
    source: "FAA Airplane Flying Handbook, Ch. 8",
  },
  {
    prompt: "Quiz me on today's weak areas",
    title: "3 questions from your flight",
    evidence: { who: "Drawn from", quote: "Tuesday's debrief with Jake — crosswinds and approach speed." },
    body: "Not a written-test bank. Every question comes from something that actually happened on your flight.",
    points: ["Aileron through the flare", "8 knots fast on short final", "One cue you'll remember Thursday"],
    action: "Start the check",
    source: "Your debrief · ACS PA.IV.E",
  },
  {
    prompt: "What should I study before Thursday?",
    title: "Two things, about ten minutes",
    evidence: { who: "Jake wants", quote: "Get stabilized earlier so you're not fixing speed at the threshold." },
    body: "Crosswind correction is close. Approach speed is the older item and the one worth the time.",
    points: ["Configuration complete before turning final", "65 KIAS by short final", "If it isn't stable, go around"],
    action: "Start 5-minute review",
    source: "FAA Airplane Flying Handbook, Ch. 8",
  },
  {
    prompt: "What keeps showing up in my training?",
    title: "Approach speed, across two instructors",
    evidence: { who: "Seen in", quote: "3 lessons — twice with Jake, once with Dana before the handover." },
    body: "It has improved, but it hasn't resolved. Speed control slips when the pattern gets busy.",
    points: ["Jul 18 — five to ten knots fast", "Aug 12 — fast on two, fixed late", "Aug 29 — high on two of four"],
    action: "See the pattern",
    source: "Your training record",
  },
  {
    prompt: "Chair-fly my next lesson",
    title: "Crosswind landing at KSQL",
    evidence: { who: "Setup", quote: "Left crosswind about 12 knots, Runway 30. You're midfield downwind." },
    body: "I'll stop at each decision point and ask what you do. Answer out loud or type it.",
    points: ["Midfield downwind, abeam the numbers", "Rolling final, drifting right and fast", "In the flare, upwind wing rising"],
    action: "Start chair-fly",
    source: "Built from Tuesday's debrief",
  },
] as const;

type Phase = "prompts" | "thinking" | "answer";

export function VectorDemo() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("prompts");
  const [tookOver, setTookOver] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPhase("answer");
  }, []);

  // The thinking beat is short on purpose -- long enough to read as work, not
  // long enough that a scrolling visitor gives up on it.
  useEffect(() => {
    if (phase !== "thinking") return;
    const t = setTimeout(() => setPhase("answer"), 650);
    return () => clearTimeout(t);
  }, [phase]);

  // Auto-play until the visitor touches it, then it's theirs.
  useEffect(() => {
    if (tookOver || reduced.current) return;
    const dwell = phase === "answer" ? 5200 : 1800;
    const t = setTimeout(() => {
      if (phase === "prompts") {
        setPhase("thinking");
      } else if (phase === "answer") {
        setIndex((i) => (i + 1) % ANSWERS.length);
        setPhase("prompts");
      }
    }, dwell);
    return () => clearTimeout(t);
  }, [phase, tookOver]);

  const answer = ANSWERS[index]!;

  function pick(i: number) {
    setTookOver(true);
    setIndex(i);
    setPhase(reduced.current ? "answer" : "thinking");
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-[#142033] p-7 shadow-[0_30px_60px_-30px_rgba(16,23,39,0.45)] sm:p-9">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-brand" aria-hidden />
        <p className="text-lg font-bold tracking-tight text-white">Vector</p>
        {phase !== "prompts" ? (
          <button
            type="button"
            onClick={() => {
              setTookOver(true);
              setPhase("prompts");
            }}
            className="ml-auto flex cursor-pointer items-center gap-1.5 text-sm font-medium text-[#9da7b8] transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Ask something else
          </button>
        ) : (
          <p className="ml-auto text-base text-[#9da7b8]">Your AI flight trainer</p>
        )}
      </div>

      {/* Fixed minimum height so the section doesn't jump as the panel swaps
          between the prompt list and an answer of a different length. */}
      <div className="mt-8 min-h-[430px]" aria-live="polite">
        {phase === "prompts" ? (
          <>
            <p className="text-balance text-xs font-bold uppercase tracking-[0.14em] text-[#9da7b8]">Ask about your own training</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {ANSWERS.map((a, i) => (
                <li key={a.prompt}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    className={cn(
                      "w-full cursor-pointer rounded-2xl border px-4 py-3.5 text-pretty text-left text-base leading-snug text-white transition-colors duration-200",
                      i === index && !tookOver
                        ? "border-brand bg-[#22304a]"
                        : "border-[#2a3a52] bg-[#1b283d] hover:border-[#9da7b8]",
                    )}
                  >
                    {a.prompt}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : phase === "thinking" ? (
          <div className="flex flex-col gap-4">
            <p className="text-base text-[#9da7b8]">{answer.prompt}</p>
            <div className="flex items-center gap-1.5" aria-label="Vector is answering">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="size-2 animate-pulse rounded-full bg-brand"
                  style={{ animationDelay: `${d * 140}ms`, animationDuration: "900ms" }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            key={answer.title}
            className="flex flex-col gap-5 motion-safe:animate-[vector-in_320ms_ease-out]"
          >
            <p className="text-base text-[#9da7b8]">{answer.prompt}</p>

            <div>
              <p className="font-display text-2xl font-bold leading-tight text-white">{answer.title}</p>
            </div>

            {/* Attribution is structural, not decorative -- it is the thing a
                generic assistant cannot produce. */}
            <blockquote className="border-l-2 border-brand/70 pl-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9da7b8]">{answer.evidence.who}</p>
              <p className="mt-1.5 text-pretty text-base italic leading-relaxed text-white">
                &ldquo;{answer.evidence.quote}&rdquo;
              </p>
            </blockquote>

            <p className="text-pretty text-base leading-relaxed text-[#c8d0dc]">{answer.body}</p>

            <ul className="flex flex-col gap-2.5">
              {answer.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-base leading-snug text-white">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-1">
              <span className="inline-flex w-fit items-center rounded-xl bg-brand px-5 py-3 text-base font-semibold text-white">
                {answer.action}
              </span>
              <p className="text-sm text-[#9da7b8]">Source: {answer.source}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes vector-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
