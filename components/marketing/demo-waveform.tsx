"use client";

import { useEffect, useState } from "react";
import { Waveform } from "@/components/waveform";
import { prefersReducedMotion, useInView } from "@/lib/marketing/use-in-view";

/** Feeds the real Waveform component a gentle synthetic amplitude so the recording UI demo doesn't sit static. */
export function DemoWaveform() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = prefersReducedMotion();
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const t = (now - start) / 1000;
      setAmplitude(0.35 + Math.sin(t * 2.1) * 0.2 + Math.sin(t * 5.3) * 0.1);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced]);

  return (
    <div ref={ref}>
      <Waveform amplitude={reduced ? 0.35 : amplitude} active={inView} />
    </div>
  );
}
