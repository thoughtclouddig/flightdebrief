"use client";

import { useRef, useState } from "react";
import { Loader2, CornerDownLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ask Vector.
 *
 * Never opens as an empty text box -- the suggested actions are the product.
 * An empty box asks the student to know what to ask, which is exactly the
 * thing they can't do at 9pm after a bad lesson, and it is also what makes a
 * general-purpose model tiring: you have to explain yourself first.
 */
export function AskVector({ suggestions, placeholder }: { suggestions: string[]; placeholder?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    const history = turns.slice(-6);
    setTurns((t) => [...t, { role: "user", content: question }]);
    setValue("");
    setBusy(true);
    try {
      const res = await fetch("/api/prototype/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "ask", question, history }),
      });
      const data = (await res.json()) as { text?: string; live?: boolean; error?: string };
      setLive(data.live ?? null);
      setTurns((t) => [...t, { role: "assistant", content: data.text ?? data.error ?? "Something went wrong." }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Couldn't reach Vector just then. Try again." }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          <p className="text-sm font-semibold text-foreground">Ask Vector</p>
          {live === false ? (
            <span className="ml-auto text-[11px] text-foreground-faint">local responder &mdash; no API key set</span>
          ) : null}
        </div>

        {turns.length === 0 ? (
          <p className="text-sm text-foreground-soft">
            I have Thursday&rsquo;s flight with Jake, your own reflection from it, and the six lessons before it.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[92%] rounded-lg px-3.5 py-2.5 text-sm",
                  t.role === "user"
                    ? "self-end bg-brand/10 text-foreground"
                    : "self-start bg-surface-sunken text-foreground-soft",
                )}
              >
                {t.content.split("\n\n").map((p, n) => (
                  <p key={n} className={n > 0 ? "mt-2" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            ))}
            {busy ? (
              <span className="self-start rounded-lg bg-surface-sunken px-3.5 py-2.5">
                <Loader2 className="size-4 animate-spin text-foreground-faint" />
              </span>
            ) : null}
            <div ref={endRef} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              disabled={busy}
              className="rounded-full border border-hairline px-3 py-1.5 text-xs text-foreground-soft transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(value);
          }}
          className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder ?? "Ask about this flight..."}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
          />
          <button type="submit" disabled={busy || !value.trim()} aria-label="Ask Vector" className="text-foreground-faint hover:text-brand disabled:opacity-40">
            <CornerDownLeft className="size-4" />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
