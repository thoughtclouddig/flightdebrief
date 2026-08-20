"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Radio, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RADIO_PRACTICE_SCENARIOS, RADIO_SCENARIO_PHASE_LABEL, type RadioScenarioPhase } from "@/lib/radio-practice-scenarios";
import type { RadioPracticeAssignment } from "@/lib/types";

const PHASES = Object.keys(RADIO_SCENARIO_PHASE_LABEL) as RadioScenarioPhase[];

/** CFI/admin control for assigning a radio-practice scenario to one student, and seeing what's already assigned/completed. */
export function AssignRadioPracticeCard({ studentId }: { studentId: string }) {
  const [assignments, setAssignments] = useState<RadioPracticeAssignment[] | null>(null);
  const [scenarioId, setScenarioId] = useState(RADIO_PRACTICE_SCENARIOS[0]!.id);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/radio-practice?studentId=${studentId}`);
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/radio-practice?studentId=${studentId}`);
      if (res.ok && !cancelled) {
        const data = await res.json();
        setAssignments(data.assignments);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function assign() {
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch("/api/radio-practice/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, studentId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to assign.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="size-4 text-brand" />
          Radio Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-900"
          >
            {PHASES.map((phase) => (
              <optgroup key={phase} label={RADIO_SCENARIO_PHASE_LABEL[phase]}>
                {RADIO_PRACTICE_SCENARIOS.filter((s) => s.phase === phase).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Button onClick={assign} disabled={assigning}>
            {assigning ? <Loader2 className="size-4 animate-spin" /> : null}
            Assign
          </Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {assignments === null ? (
          <p className="text-sm text-foreground-faint">Loading…</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-foreground-faint">Nothing assigned yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {assignments.map((a) => {
              const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.id === a.scenarioId);
              return (
                <li key={a.id} className="flex items-center gap-2 text-sm text-foreground-soft">
                  {a.status === "completed" ? (
                    a.correct ? (
                      <CheckCircle2 className="size-4 shrink-0 text-good" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-danger" />
                    )
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-brand" />
                  )}
                  {scenario?.title ?? a.scenarioId}
                  <span className="ml-auto text-xs text-foreground-faint">
                    {a.status === "completed" ? (a.correct ? "Passed" : "Missed elements") : "Assigned"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
