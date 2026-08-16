"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";

const WORDS = ["Learn", "Study", "Prepare", "Improve"] as const;

const HOLD_MS = 2300;
/** IMPROVE gets a longer hold before the sequence loops back to LEARN. */
const IMPROVE_HOLD_MS = 3400;
const TRANSITION_MS = 200;
const WIDTH_TRANSITION_MS = 250;

type Phase = "in" | "out" | "jump";

const PHASE_CLASS: Record<Phase, string> = {
  in: "translate-y-0 opacity-100 transition-all duration-200 ease-out",
  out: "-translate-y-2 opacity-0 transition-all duration-200 ease-out",
  jump: "translate-y-2 opacity-0",
};

/**
 * The one animated instance of the "FLY. DEBRIEF. [ACTION]. REPEAT." brand
 * device (see product brief -- this exact phrase is intentionally NOT
 * animated anywhere else on the page). Cycles the third word only, holding
 * each ~2.3s with a restrained ~6-8px fade/slide, like an instrument
 * changing state rather than an ad transition. Respects prefers-reduced-
 * motion by freezing on "Improve" -- the spec's designated static fallback.
 */
export function BrandDeviceLoop() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("in");
  const cancelledRef = useRef(false);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [wordWidth, setWordWidth] = useState<number | null>(null);
  const flyContainerRef = useRef<HTMLDivElement>(null);
  const [flying, setFlying] = useState(false);
  const [reducedMotionForPlane, setReducedMotionForPlane] = useState(false);

  // Measures the just-updated word and animates the wrapping box to that width
  // (via CSS transition on `width`) instead of reserving a fixed-width slot --
  // "Repeat." reflows smoothly around the true width of each word, and the
  // whole centered line adjusts symmetrically as the box resizes.
  useLayoutEffect(() => {
    if (wordRef.current) {
      setWordWidth(wordRef.current.getBoundingClientRect().width);
    }
  }, [index]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      // One-time read of an external system (matchMedia) on mount to pick the spec's
      // designated static fallback ("Improve.") -- not a derived-state anti-pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(WORDS.length - 1);
      return;
    }

    cancelledRef.current = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function tick(currentIndex: number) {
      const hold = currentIndex === WORDS.length - 1 ? IMPROVE_HOLD_MS : HOLD_MS;
      timeouts.push(
        setTimeout(() => {
          if (cancelledRef.current) return;
          setPhase("out");
          timeouts.push(
            setTimeout(() => {
              if (cancelledRef.current) return;
              const next = (currentIndex + 1) % WORDS.length;
              setIndex(next);
              setPhase("jump");
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (cancelledRef.current) return;
                  setPhase("in");
                  tick(next);
                });
              });
            }, TRANSITION_MS),
          );
        }, hold),
      );
    }

    tick(0);
    return () => {
      cancelledRef.current = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Replays the flyover every time it scrolls into view (unlike the one-shot
  // Reveal pattern) -- a one-shot version left the plane permanently sitting
  // in its faded-out end state for the rest of the page visit. Under
  // prefers-reduced-motion, skip the observer entirely and show a static
  // plane -- never a plane frozen invisible mid-fade.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotionForPlane(reduceMotion);
    if (reduceMotion) return;

    const el = flyContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setFlying(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#101727] px-6 pb-1 pt-8 text-center sm:pb-2 sm:pt-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />

      <div className="relative mx-auto max-w-4xl">
        <div className="font-display flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-[clamp(1.75rem,5.5vw,3.25rem)] font-extrabold uppercase tracking-wide text-white lg:flex-nowrap">
          <span className="shrink-0 whitespace-nowrap">Fly. Debrief.&nbsp;</span>
          <span
            className="relative inline-block shrink-0 overflow-hidden align-baseline"
            style={{
              width: wordWidth ?? "auto",
              transitionProperty: "width",
              transitionDuration: `${WIDTH_TRANSITION_MS}ms`,
              transitionTimingFunction: "ease-out",
              overflowY: "visible",
            }}
          >
            <span ref={wordRef} className={`inline-block whitespace-nowrap text-brand ${PHASE_CLASS[phase]}`}>
              {WORDS[index]}.
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap">&nbsp;Repeat.</span>
        </div>

        <div className="relative mx-auto mt-0.5 h-6 max-w-4xl" aria-hidden="true">
          {reducedMotionForPlane ? (
            <Plane className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rotate-45 text-brand" />
          ) : (
            <div ref={flyContainerRef} className="absolute inset-0">
              <Plane
                className="absolute top-1/2 size-5 -translate-y-1/2 rotate-45 text-brand"
                style={{
                  left: flying ? "calc(100% - 4px)" : "-4px",
                  opacity: flying ? 0 : 1,
                  transition: flying ? "left 4800ms ease-in-out, opacity 1000ms ease-in 3800ms" : "none",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
