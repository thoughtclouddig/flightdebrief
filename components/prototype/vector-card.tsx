"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-brand" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">Vector</span>
      </div>

      <h3 className="mt-2 text-xl font-semibold leading-tight text-foreground">{card.title}</h3>
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
            <EvidenceRow key={i} source={e.source} label={e.label} text={e.text} />
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
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[15px] font-semibold text-brand-foreground"
        >
          {card.nextAction.label}
          <ArrowRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

const SOURCE_STYLE: Record<EvidenceSource, { border: string; label: string }> = {
  instructor: { border: "border-l-brand", label: "text-brand" },
  student: { border: "border-l-good", label: "text-good" },
  vector: { border: "border-l-hairline", label: "text-foreground-faint" },
  faa: { border: "border-l-amber", label: "text-amber" },
};

function EvidenceRow({ source, label, text }: { source: EvidenceSource; label: string; text: string }) {
  const style = SOURCE_STYLE[source];
  const quoted = source === "instructor" || source === "student";
  return (
    <div className={cn("border-l-2 pl-3", style.border)}>
      <p className={cn("flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide", style.label)}>
        {quoted ? <Quote className="size-2.5" /> : null}
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm text-foreground-soft", quoted && "italic")}>
        {quoted ? `"${text}"` : text}
      </p>
    </div>
  );
}
