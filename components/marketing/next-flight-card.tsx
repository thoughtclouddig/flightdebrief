"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Check, MousePointer2, Sparkles } from "lucide-react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";

/**
 * The next-flight card, assembling itself when it scrolls into view.
 *
 * The claim the section makes is that this is BUILT from the flight you just
 * flew, rather than pulled off a syllabus. A card that is simply present when
 * you arrive at it looks pre-written; one that composes -- source line first,
 * then each block landing in order -- shows the derivation the copy is
 * asserting.
 *
 * The stagger is 260ms a block, which is slow enough to read as sequence and
 * fast enough that the whole card is settled before a normal scroll would
 * carry it off screen. Reduced motion renders the finished state immediately.
 */
const FOCUS = ["Stabilized approach speed", "Crosswind correction through touchdown"] as const;
const TRAIN = ["3-minute review", "Quick knowledge check", "Chair-flying prompt"] as const;
const REMEMBER = ["Get configured earlier", "Hold correction through touchdown", "Don't chase the flare"] as const;

const BLOCK_COUNT = 4;

/**
 * When each step fires, in ms from the card entering view.
 *
 * Explicit rather than arithmetic because the tail is not evenly paced: the
 * four blocks assemble briskly, then there is a beat before the pointer moves
 * so the finished card can be read as a finished card first. A tap that lands
 * while things are still arriving looks like a glitch rather than a choice.
 */
const SCHEDULE = [420, 680, 940, 1200, 1460, 2000, 2380, 2620];
const STEP_POINTER = 5;
const STEP_PRESSED = 6;
const STEP_OPENED = 7;

export function NextFlightCard({ className }: { className?: string } = {}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [step, setStep] = useState(-1);

  // Reduced motion is handled in CSS (motion-reduce: on each block) rather
  // than by branching here: reading matchMedia during the effect would mean
  // setting state synchronously on mount, and the class-based version also
  // survives someone flipping the OS setting mid-visit.
  useEffect(() => {
    if (!inView) return;
    const timers = SCHEDULE.map((at, i) => setTimeout(() => setStep(i), at));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const built = step >= BLOCK_COUNT;

  return (
    <div ref={ref} className={cn("mx-auto mt-14 max-w-[720px]", className)}>
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_50px_-24px_rgba(16,23,39,0.28)]">
        <div className="bg-[#142033] px-5 py-6 sm:px-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Your next flight</p>
          <p className="font-display mt-1.5 text-2xl font-bold text-white sm:text-3xl">
            Thursday · Crosswind + Short Field
          </p>

          {/* The source line resolves from "building" to "built", which is the
              one moment that says where the contents came from. */}
          <p className="mt-1 flex items-center gap-2 text-base text-[#9da7b8]">
            <span
              className={cn(
                "transition-opacity duration-500",
                built ? "text-[#48be83] opacity-100" : "opacity-0",
              )}
              aria-hidden
            >
              <Check className="size-4" strokeWidth={3} />
            </span>
            <span>
              With Jake ·{" "}
              <span className="transition-opacity duration-500">
                {built ? "built from Tuesday's debrief" : "building from Tuesday's debrief"}
              </span>
            </span>
          </p>
        </div>

        <div className="flex flex-col">
          <Block title="What matters most" show={step >= 0}>
            <ol className="flex flex-col gap-3">
              {FOCUS.map((f, i) => (
                <li key={f} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f4f5f6] text-sm font-bold tabular-nums text-[#414B57]">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-snug text-[#101727]">{f}</span>
                </li>
              ))}
            </ol>
          </Block>

          <Block title="What your instructor wants continued" show={step >= 1}>
            <blockquote className="border-l-2 border-brand/60 pl-4">
              <p className="text-pretty text-lg italic leading-relaxed text-[#4b545d]">
                &ldquo;Maintain 65 KIAS through short final.&rdquo;
              </p>
              <footer className="mt-1 text-sm font-medium text-[#414B57]">Jake, after Tuesday&rsquo;s flight</footer>
            </blockquote>
          </Block>

          <Block title="Train with Vector" show={step >= 2}>
            {/*
              * The card finishes by being used, not just by being built.
              *
              * Everything above this point is AfterFlight showing the student
              * what it worked out. The section's claim is that the next flight
              * starts where the last one left off, and the moment that becomes
              * true is the moment they act on it -- so the sequence ends with
              * a lesson actually being opened rather than with a row of
              * buttons nobody touches.
              *
              * The pointer is decorative and hidden from assistive tech; the
              * pill it "presses" is not a real control, so it carries no
              * button semantics either. Under reduced motion the pointer never
              * renders and the opened panel is simply present -- the end state
              * without the performance.
              */}
            <div className="relative">
              <ul className="flex flex-wrap gap-2.5">
                {TRAIN.map((t, i) => {
                  const chosen = i === 0 && step >= STEP_PRESSED;
                  return (
                    <li
                      key={t}
                      className={cn(
                        "rounded-full border px-4 py-2 text-base font-medium transition-[background-color,border-color,color,transform] duration-300 ease-out",
                        chosen
                          ? "border-brand bg-brand text-white"
                          : "border-[#e3e5e8] bg-white text-[#101727]",
                        i === 0 && step === STEP_PRESSED && "scale-[0.97]",
                        "motion-reduce:transition-none motion-reduce:scale-100",
                      )}
                    >
                      {t}
                    </li>
                  );
                })}
              </ul>

              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute left-[86px] top-[26px] transition-[opacity,transform] duration-500 ease-out motion-reduce:hidden",
                  step >= STEP_POINTER ? "translate-x-0 translate-y-0 opacity-100" : "translate-x-6 translate-y-6 opacity-0",
                  step >= STEP_PRESSED && "translate-y-[2px]",
                )}
              >
                <MousePointer2 className="size-6 fill-[#101727] text-white drop-shadow-[0_2px_6px_rgba(16,23,39,0.35)]" />
              </span>
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
                step >= STEP_OPENED ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                "motion-reduce:mt-4 motion-reduce:grid-rows-[1fr] motion-reduce:opacity-100 motion-reduce:transition-none",
              )}
            >
              <div className="overflow-hidden">
                <div className="rounded-2xl bg-[#142033] px-4 py-4 sm:px-5">
                  {/* No text-balance: it is for headings, and on a label it shortens
                      the measure and forces the second line it is meant to
                      prevent.
                      
                      The label was also simply too long. Measured at the
                      theme's smallest token -- text-xs is 15px here, not 12px,
                      on purpose -- "Vector - 3-minute review" needs 263px
                      against 253px of column even after the card gave back
                      padding. Shrinking the type or tightening the tracking
                      further would have made this label quietly different from
                      every other one on the page to hide ten pixels, so the
                      words gave way instead: 225px, standard tracking. */}
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
                    <Sparkles className="size-3.5" aria-hidden />
                    Vector review · 3 min
                  </p>
                  <p className="mt-2 text-pretty text-base leading-relaxed text-[#dfe4ec]">
                    Why the correction has to keep increasing as you slow &mdash; then two questions from
                    Thursday&rsquo;s flight.
                  </p>
                </div>
              </div>
            </div>
          </Block>

          <Block title="Remember in the cockpit" show={step >= 3}>
            <ul className="flex flex-col gap-2.5">
              {REMEMBER.map((r) => (
                <li key={r} className="flex items-start gap-3 text-lg leading-snug text-[#101727]">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </div>
      </div>
    </div>
  );
}

/**
 * Opacity and transform only -- animating height would reflow the page under
 * a reader's cursor four times in a row. The blocks hold their space from the
 * start and fade into it.
 *
 * Headings carry full ink at display weight and the blocks are ruled apart.
 * The first version used small gray uppercase labels separated by whitespace,
 * which made the whole card read as one column and left every heading quieter
 * than the body text underneath it.
 */
function Block({ title, show, children }: { title: string; show: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "border-b border-black/[0.07] px-5 py-7 transition-[opacity,transform] duration-500 ease-out last:border-b-0 sm:px-9 sm:py-8",
        show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
      )}
    >
      {/* A short brand rule rather than colored text: an orange heading would
          read as a link, and orange is the CTA color on this page. The marker
          gives the heading a color cue without spending the accent on it. */}
      <h3 className="font-display flex items-center gap-3 text-lg font-bold leading-snug text-[#101727]">
        <span className="h-4 w-[3px] shrink-0 rounded-full bg-brand" aria-hidden />
        {title}
      </h3>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}
