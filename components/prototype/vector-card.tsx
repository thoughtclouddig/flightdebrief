"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Evidence, VectorMark } from "@/components/prototype/ui";
import type { EvidenceSource, VectorCard } from "@/lib/ai/vector-schema";

/**
 * Renders one Vector response as native UI.
 *
 * This component is the product rule made concrete: Vector returns a typed
 * object and the app draws components from it. Nothing here renders markdown,
 * and the long-form `detail` is behind an explicit tap -- a student should
 * never have to read a wall of model output to find the one thing that
 * matters.
 *
 * The evidence rows are styled per source, which is what keeps attribution
 * structural rather than a matter of phrasing: an instructor quote can never
 * be mistaken for Vector's inference, because they do not look alike.
 */
export function VectorCardView({ card, onAction }: { card: VectorCard; onAction?: (target: string | null) => void }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <VectorMark />

      <h3 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight text-foreground">{card.title}</h3>
      {card.summary ? <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">{card.summary}</p> : null}

      {card.stats.length > 0 ? (
        <div className="mt-4 flex gap-6">
          {card.stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
              <p className="text-xs uppercase tracking-wide text-foreground-faint">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {card.evidence.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2.5">
          {card.evidence.map((e, i) => (
            <Evidence
              key={i}
              label={e.label}
              text={e.text}
              tone={toneFor(e.source)}
              quoted={e.source === "instructor" || e.source === "student"}
            />
          ))}
        </div>
      ) : null}

      {card.keyPoints.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {card.keyPoints.map((k) => (
            <li key={k} className="flex items-start gap-2.5 text-[15px] text-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              {k}
            </li>
          ))}
        </ul>
      ) : null}

      {card.detail ? (
        <div className="mt-4">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground-faint transition-colors hover:text-brand"
          >
            {showDetail ? "Less" : "Explain more"}
            <ChevronDown className={cn("size-3.5 transition-transform", showDetail && "rotate-180")} />
          </button>
          {showDetail ? <p className="mt-2 text-sm leading-relaxed text-foreground-soft">{card.detail}</p> : null}
        </div>
      ) : null}

      {/* Exactly one action. Three CTAs is a menu, not a next step. */}
      {card.nextAction ? (
        <button
          onClick={() => onAction?.(card.nextAction!.target)}
          className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-[17px] font-semibold text-brand-foreground"
        >
          {card.nextAction.label}
          <ArrowRight className="size-[18px]" />
        </button>
      ) : null}
    </div>
  );
}

/** Maps a schema source onto the shared, deliberately quiet evidence rule. */
function toneFor(source: EvidenceSource): "instructor" | "student" | "neutral" {
  return source === "instructor" ? "instructor" : source === "student" ? "student" : "neutral";
}
