"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Volume2 } from "lucide-react";
import { VectorPanel } from "@/components/prototype/vector-panel";
import { cn } from "@/lib/utils";
import {
  INSTRUCTOR,
  INSTRUCTOR_DEBRIEF,
  LAST_FLIGHT,
  PERCEPTION_GAPS,
  STRUCTURED,
  STUDENT_REFLECTION,
  SUGGESTED,
} from "@/lib/prototype/vector-data";

/**
 * Debrief answers: what happened last flight?
 *
 * Three short lists, one perception-gap card, the replay, and Vector. The
 * raw transcript is behind a tap -- it is the least useful artifact on the
 * screen and putting it inline was a large part of what made the previous
 * version feel like a record rather than a product.
 */
export default function DebriefPage() {
  const [showTranscript, setShowTranscript] = useState(false);
  // One gap, not the full history: the significant one is the point.
  const gap = PERCEPTION_GAPS.find((g) => g.takeaway)!;

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <div>
        <h1 className="text-[32px] font-semibold leading-none tracking-tight text-foreground">Debrief</h1>
        <p className="mt-1.5 text-sm text-foreground-faint">
          {LAST_FLIGHT.date} &middot; {LAST_FLIGHT.lesson} &middot; {INSTRUCTOR.firstName}
        </p>
      </div>

      <button className="flex items-center gap-3 rounded-xl border border-hairline px-4 py-4 text-left transition-colors hover:border-brand">
        <Volume2 className="size-5 shrink-0 text-brand" />
        <span className="flex-1 text-[15px] font-medium text-foreground">Listen again</span>
        <span className="text-sm text-foreground-faint">1:12</span>
      </button>

      <List label="Went well" items={STRUCTURED.wentWell} good />
      <List label="Work on" items={STRUCTURED.needsWork} />
      <List label={`${INSTRUCTOR.firstName} wants next`} items={STRUCTURED.instructorEmphasis.map((e) => e.quote)} quoted />

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">
          Where you landed differently
        </h2>
        <div className="mt-3 rounded-2xl border border-hairline p-5">
          <p className="text-[15px] font-semibold text-foreground">{gap.task}</p>
          <div className="mt-3 border-l-2 border-good pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-good">You</p>
            <p className="mt-0.5 text-sm text-foreground-soft">{gap.studentView}</p>
          </div>
          <div className="mt-2.5 border-l-2 border-brand pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{INSTRUCTOR.firstName}</p>
            <p className="mt-0.5 text-sm text-foreground-soft">{gap.instructorView}</p>
          </div>
          <p className="mt-3 rounded-xl bg-surface-sunken px-3.5 py-3 text-sm text-foreground-soft">{gap.takeaway}</p>
        </div>
      </section>

      <VectorPanel context={`${LAST_FLIGHT.lesson} · ${INSTRUCTOR.firstName} · ${LAST_FLIGHT.date}`} suggestions={SUGGESTED.afterDebrief} />

      {/* Last, and collapsed. */}
      <div className="border-t border-hairline pt-4">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex w-full items-center gap-2 text-sm font-medium text-foreground-faint hover:text-foreground-soft"
        >
          View transcript
          <ChevronDown className={cn("size-3.5 transition-transform", showTranscript && "rotate-180")} />
        </button>
        {showTranscript ? (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{INSTRUCTOR.firstName}</p>
              <p className="mt-0.5 text-sm text-foreground-soft">{INSTRUCTOR_DEBRIEF}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-good">You</p>
              <p className="mt-0.5 text-sm text-foreground-soft">{STUDENT_REFLECTION}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function List({ label, items, good, quoted }: { label: string; items: string[]; good?: boolean; quoted?: boolean }) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">{label}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground">
            {good ? (
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-good" />
            ) : (
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", quoted ? "bg-brand" : "bg-amber")} />
            )}
            <span className={quoted ? "italic text-foreground-soft" : undefined}>
              {quoted ? `"${item}"` : item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
