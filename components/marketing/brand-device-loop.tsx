"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrandDeviceFrame } from "@/components/marketing/brand-device-frame";

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

  return (
    <BrandDeviceFrame
      action={
        <>
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
        </>
      }
    />
  );
}
