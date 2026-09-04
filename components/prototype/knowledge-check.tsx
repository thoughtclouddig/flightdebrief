"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KNOWLEDGE_CHECK, CONCEPTS } from "@/lib/prototype-fixtures/vector-data";

interface Result {
  correct: boolean;
  isReflection: boolean;
  explanation: string;
  concept: string | null;
}

/**
 * Check Yourself.
 *
 * Three rules, all from the council's student: the questions come from HER
 * flight (not a written-test bank), feedback is immediate and explains why,
 * and there is NO SCORE -- "show me a score and it becomes another thing I'm
 * failing at."
 *
 * Remediation is targeted: a concept card appears only when an answer is
 * missed. Teaching everyone the same thing after every flight is how this
 * becomes a wall of generated prose nobody reads.
 */
export function KnowledgeCheck() {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const q = KNOWLEDGE_CHECK[i]!;

  async function submit() {
    if (busy) return;
    if (q.kind !== "reflection" && !selected) return;
    if (q.kind === "reflection" && !text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/prototype/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "grade", questionId: q.id, optionId: selected }),
      });
      setResult((await res.json()) as Result);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (i + 1 >= KNOWLEDGE_CHECK.length) {
      setDone(true);
      return;
    }
    setI(i + 1);
    setSelected(null);
    setText("");
    setResult(null);
  }

  if (done) {
    return (
      <Card className="border-good/40">
        <CardContent className="flex items-start gap-3 py-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" />
          <div>
            <p className="text-sm font-semibold text-foreground">That&rsquo;s the check done.</p>
            <p className="mt-1 text-sm text-foreground-soft">
              The one to carry into Thursday: the aileron keeps going in as you slow &mdash; it doesn&rsquo;t hold
              steady, and it doesn&rsquo;t come out at touchdown.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const concept = result?.concept ? CONCEPTS[result.concept] : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-brand" />
          <p className="text-sm font-semibold text-foreground">Check Yourself</p>
          {/* Position, not score. */}
          <span className="ml-auto text-xs text-foreground-faint">
            {i + 1} of {KNOWLEDGE_CHECK.length}
          </span>
        </div>

        <p className="text-sm text-foreground">{q.prompt}</p>

        {q.kind === "reflection" ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={Boolean(result)}
            rows={2}
            placeholder="In your own words..."
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-faint focus:border-brand"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {q.options?.map((o) => {
              const isPicked = selected === o.id;
              const isRight = result && o.id === q.correctOptionId;
              const isWrongPick = result && isPicked && !result.correct;
              return (
                <button
                  key={o.id}
                  onClick={() => !result && setSelected(o.id)}
                  disabled={Boolean(result)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                    isRight
                      ? "border-good bg-good/10 text-foreground"
                      : isWrongPick
                        ? "border-danger bg-danger/10 text-foreground"
                        : isPicked
                          ? "border-brand text-foreground"
                          : "border-hairline text-foreground-soft hover:border-brand/50",
                  )}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
        )}

        {result ? (
          <>
            <div className="rounded-lg bg-surface-sunken px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                {result.isReflection ? "Worth holding onto" : result.correct ? "That's right" : "Not quite"}
              </p>
              <p className="mt-1 text-sm text-foreground-soft">{result.explanation}</p>
            </div>

            {concept ? (
              <div className="rounded-lg border border-amber/40 px-3.5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber">Vector &mdash; let&rsquo;s fix that one</p>
                <p className="mt-1.5 text-sm font-semibold text-foreground">{concept.title}</p>
                <p className="mt-1.5 text-sm text-foreground-soft">{concept.whyItHappens}</p>
                <p className="mt-2 text-sm text-foreground-soft">
                  <span className="font-medium text-foreground">Picture it: </span>
                  {concept.picture}
                </p>
                <p className="mt-2 text-xs text-foreground-faint">{concept.sources[0]}</p>
              </div>
            ) : null}

            <button onClick={next} className={cn(buttonVariants({ size: "sm" }), "self-start")}>
              {i + 1 >= KNOWLEDGE_CHECK.length ? "Finish" : "Next question"}
            </button>
          </>
        ) : (
          <button
            onClick={() => void submit()}
            disabled={busy || (q.kind === "reflection" ? !text.trim() : !selected)}
            className={cn(buttonVariants({ size: "sm" }), "self-start gap-2")}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Check
          </button>
        )}
      </CardContent>
    </Card>
  );
}
