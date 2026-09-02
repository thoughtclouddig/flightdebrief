"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The sticky stage identity for the Debrief band, and the only client-side
 * piece of it.
 *
 * It reads the modules out of the DOM rather than receiving them as props so
 * the three modules stay server components -- they are photographs, text and
 * two demos that already manage their own state, and none of that needs to
 * become client-rendered just so a label can highlight.
 *
 * Deliberately not a scroll listener. An IntersectionObserver with a band
 * across the middle of the viewport fires only when a module crosses it,
 * which is both cheaper and steadier than recomputing offsets on every frame
 * of a scroll -- the rail should feel like it is keeping up, not like it is
 * being animated.
 */
export function DebriefStageRail({ modules }: { modules: readonly { id: string; label: string }[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = modules
      .map((m) => document.getElementById(m.id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    /*
     * The band is the middle third of the viewport. A single threshold line
     * makes the last module unreachable -- it is the shortest of the three and
     * on a tall screen its top never crosses a line placed near the middle, so
     * the rail would stick on module two through the end of the stage. A band
     * asks "which module is in front of the reader" instead of "which module
     * has passed a point", and every module answers that at some scroll
     * position.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = nodes.indexOf(entry.target as HTMLElement);
          if (i !== -1) setActive(i);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );

    for (const n of nodes) observer.observe(n);
    return () => observer.disconnect();
  }, [modules]);

  return (
    <nav aria-label="Debrief stage" className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
      <p className="font-display text-[13px] font-bold uppercase tracking-[0.22em] text-brand">Debrief</p>
      <p className="mt-4 text-pretty text-[15px] leading-relaxed text-[#414B57]">
        What the lesson actually contained, in the order you find it out.
      </p>

      <ol className="mt-8 flex flex-col">
        {modules.map((m, i) => {
          const on = i === active;
          return (
            <li key={m.id}>
              <a
                href={`#${m.id}`}
                aria-current={on ? "step" : undefined}
                className={cn(
                  "group flex border-l-2 py-2.5 pl-4",
                  // The active state is carried by weight, color and the rule
                  // -- three quiet signals rather than one loud one. Motion is
                  // limited to the color transition; nothing slides or scales,
                  // because the reader is already moving.
                  "motion-safe:transition-colors motion-safe:duration-300",
                  on ? "border-brand" : "border-black/[0.09]",
                )}
              >
                <span
                  className={cn(
                    "text-[15px] leading-snug motion-safe:transition-colors motion-safe:duration-300",
                    on ? "font-semibold text-[#101727]" : "text-[#414B57] group-hover:text-[#101727]",
                  )}
                >
                  {m.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
