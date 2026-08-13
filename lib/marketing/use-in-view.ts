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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setObservedInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "-40px", ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options, reduced]);

  return { ref, inView: reduced ? true : observedInView };
}

export { prefersReducedMotion };
