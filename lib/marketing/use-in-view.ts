"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One-shot "has this element scrolled into view yet" hook. Under
 * prefers-reduced-motion, reports true immediately without ever observing --
 * derived at render time, never via a synchronous setState in an effect.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [observedInView, setObservedInView] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    // Safety net. Everything wrapped in Reveal starts at opacity-0 and is
    // only made visible by this observer, so anything that stops it firing --
    // a browser that mis-handles the observer inside an iframe, a hidden tab
    // at load, an extension -- renders a page of nothing. A page that fails
    // to animate is a small problem; a page that fails to appear is not, and
    // the cost of insuring against it is one timer.
    const failsafe = setTimeout(() => setObservedInView(true), 1200);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(failsafe);
          setObservedInView(true);
          observer.disconnect();
        }
      },
      // threshold is a fraction of the *target's own height* -- a content
      // block taller than ~5x the viewport (long-form pages like
      // what-is-afterflight, privacy, terms) could never satisfy 0.2 and
      // would stay invisible forever. threshold: 0 fires on first overlap
      // regardless of the target's height; rootMargin still controls how
      // early/late that counts as "in view".
      // Fires BEFORE the block reaches the viewport, not 40px after.
      //
      // "-40px" shrank the root on every side, so a reveal began only once the
      // element was already on screen and then kept moving for 700ms while the
      // reader scrolled past it. That is what reads as a jump: content sliding
      // under a moving eye. Growing the root 25% below the fold starts the
      // animation early enough that most of it is spent off screen, so the
      // block is settled by the time it can be read. The small top inset stays,
      // so nothing triggers while scrolling upward past it.
      { threshold: 0, rootMargin: "-40px 0px 25% 0px", ...options },
    );
    observer.observe(el);
    return () => {
      clearTimeout(failsafe);
      observer.disconnect();
    };
  }, [options, reduced]);

  return { ref, inView: reduced ? true : observedInView };
}

export { prefersReducedMotion };
