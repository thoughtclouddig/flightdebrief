"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Sparkles } from "lucide-react";
import { VectorCardView } from "@/components/prototype/vector-card";
import type { VectorCard } from "@/lib/ai/vector-schema";

/**
 * Vector, as a trainer rather than a chat transcript.
 *
 * Default state is context plus suggested actions -- never an empty box, and
 * never a scrollback. One answer is on screen at a time, because the previous
 * version's growing transcript was the single biggest reason the prototype
 * read as a chatbot with cards around it.
 *
 * The answer is a VectorCard rendered as UI, so length is bounded by the
 * schema rather than by asking the model to be brief.
 */
export function VectorPanel({
  context,
  suggestions,
  onAction,
}: {
  context: string;
  suggestions: string[];
  onAction?: (target: string | null) => void;
}) {
  const router = useRouter();
  const [card, setCard] = useState<VectorCard | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setValue("");
    try {
      const res = await fetch("/api/prototype/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "ask", question }),
      });
      const data = (await res.json()) as { card?: VectorCard; live?: boolean };
      if (data.card) setCard(data.card);
      setLive(data.live ?? null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {card ? (
        <>
          {/* Chair-fly is a route now, not a mode, so it resolves here for
              every surface that renders a Vector card -- Train and Debrief
              both offer it, and only one of them was passing an onAction. */}
          <VectorCardView
            card={card}
            onAction={(t) => (t === "chair-fly" ? router.push("/prototype/vector/train/chair-fly") : onAction?.(t))}
          />
          <button
            onClick={() => setCard(null)}
            className="self-start text-sm font-medium text-foreground-faint transition-colors hover:text-brand"
          >
            Ask something else
          </button>
        </>
      ) : (
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-brand" aria-hidden />
            <span className="text-[17px] font-semibold tracking-tight text-foreground">Vector</span>
          </div>
          {/*
           * The flight is a heading here, not a caption. At 14px faint it was
           * quieter than the suggestion buttons beneath it, so the one line
           * that says WHICH FLIGHT Vector is answering about was the least
           * visible thing in the card.
           */}
          <p className="mt-2 text-[17px] font-medium leading-snug text-foreground">{context}</p>
          <p className="mt-1 text-[15px] text-foreground-soft">Ask about this flight</p>

          <div className="mt-5 flex flex-col gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => void ask(s)}
                disabled={busy}
                className="rounded-xl border border-hairline px-4 py-3 text-left text-[15px] text-foreground transition-colors hover:border-brand disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {busy ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-foreground-faint">
              <Loader2 className="size-4 animate-spin" />
              Thinking
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(value);
            }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-surface-sunken px-4 py-3"
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask Vector…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-foreground-faint"
            />
            <button type="submit" disabled={busy || !value.trim()} aria-label="Ask" className="text-foreground-faint disabled:opacity-40">
              <CornerDownLeft className="size-4" />
            </button>
          </form>

          {live === false ? (
            <p className="mt-2 text-[11px] text-foreground-faint">Local responder &mdash; no API key set</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
