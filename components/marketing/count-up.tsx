"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion, useInView } from "@/lib/marketing/use-in-view";

/** Counts up to `value` once, the first time it scrolls into view. Renders the final value directly under reduced motion. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const reduced = prefersReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const duration = 900;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      {reduced ? value : display}
      {suffix}
    </span>
  );
}
