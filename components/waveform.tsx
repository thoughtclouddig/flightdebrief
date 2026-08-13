"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 40;

export function Waveform({ amplitude, active }: { amplitude: number; active: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.05));
  const [lastSample, setLastSample] = useState<{ amplitude: number; active: boolean } | null>(null);

  // Adjust state during render in response to changed props (React's
  // documented alternative to useEffect for this kind of derived history).
  if (lastSample?.amplitude !== amplitude || lastSample?.active !== active) {
    setLastSample({ amplitude, active });
    setBars((prev) => [...prev.slice(1), active ? Math.min(1, Math.max(0.06, amplitude)) : 0.05]);
  }

  return (
    <div className="flex h-20 items-center justify-center gap-[3px]">
      {bars.map((v, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full transition-[height] duration-75",
            active ? "bg-brand" : "bg-slate-300 dark:bg-white/15",
          )}
          style={{ height: `${Math.max(6, v * 80)}px` }}
        />
      ))}
    </div>
  );
}
