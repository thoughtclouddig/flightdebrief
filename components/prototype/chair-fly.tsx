"use client";

import { useState } from "react";
import { Loader2, Plane, CornerDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CHAIR_FLY, type ChairFlyStep } from "@/lib/prototype/vector-data";

/**
 * Chair Fly.
 *
 * Vector sets a scene and asks what you'd do -- it does not explain first.
 * That ordering is the whole point: recall before feedback is what makes
 * this practice rather than reading, and it is the one thing no competitor
 * in the scan does at all (radio phraseology is graded everywhere; maneuver
 * recitation is graded nowhere).
 *
 * The scenario is bound to this student's own debrief -- left crosswind,
 * fast on final, correction relaxed in the flare -- which is what stops it
 * being a generic maneuver library anyone could clone.
 */
export function ChairFly() {
  const [step, setStep] = useState<ChairFlyStep | null>(CHAIR_FLY.steps[0] ?? null);
  const [log, setLog] = useState<{ who: "vector" | "you"; text: string }[]>([
    { who: "vector", text: CHAIR_FLY.intro },
  ]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);

  function begin() {
    setStarted(true);
    const first = CHAIR_FLY.steps[0]!;
    setLog((l) => [...l, { who: "vector", text: `${first.setup} ${first.prompt}` }]);
  }

  async function answer() {
    if (!value.trim() || !step || busy) return;
    const said = value;
    setLog((l) => [...l, { who: "you", text: said }]);
    setValue("");
    setBusy(true);
    try {
      const res = await fetch("/api/prototype/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "chair_fly", stepId: step.id, answer: said }),
      });
      const data = (await res.json()) as { response: string; next: ChairFlyStep | null };
      setLog((l) => [...l, { who: "vector", text: data.response }]);
      if (data.next) {
        setLog((l) => [...l, { who: "vector", text: `${data.next!.setup} ${data.next!.prompt}` }]);
        setStep(data.next);
      } else {
        setLog((l) => [
          ...l,
          { who: "vector", text: "That's the approach. Same two things Jake left open, rehearsed once before Thursday." },
        ]);
        setStep(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center gap-2">
          <Plane className="size-4 text-brand" />
          <p className="text-sm font-semibold text-foreground">Chair Fly &mdash; {CHAIR_FLY.title}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {log.map((entry, i) => (
            <p
              key={i}
              className={
                entry.who === "you"
                  ? "self-end max-w-[92%] rounded-lg bg-brand/10 px-3.5 py-2 text-sm text-foreground"
                  : "self-start max-w-[92%] rounded-lg bg-surface-sunken px-3.5 py-2 text-sm text-foreground-soft"
              }
            >
              {entry.text}
            </p>
          ))}
          {busy ? <Loader2 className="size-4 animate-spin self-start text-foreground-faint" /> : null}
        </div>

        {!started ? (
          <button
            onClick={begin}
            className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand"
          >
            Start the scenario
          </button>
        ) : step ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void answer();
            }}
            className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2"
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="What do you do?"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
            />
            <button type="submit" disabled={busy || !value.trim()} aria-label="Answer" className="text-foreground-faint hover:text-brand disabled:opacity-40">
              <CornerDownLeft className="size-4" />
            </button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
