"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Radio, Sparkles, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RADIO_PRACTICE_SCENARIOS, RADIO_SCENARIO_PHASE_LABEL, type RadioScenarioPhase } from "@/lib/radio-practice-scenarios";
import type { RadioPracticeAssignment } from "@/lib/types";

const PHASES = Object.keys(RADIO_SCENARIO_PHASE_LABEL) as RadioScenarioPhase[];

/**
 * CFI/admin control for assigning a radio-practice scenario to one student,
 * seeing what's already assigned/completed, and -- when the student's
 * training signals flag a radio-communications weakness (RADIO_COMMUNICATIONS
 * or TOWER_READBACKS at "Needs Coaching", computed server-side in
 * components/student-training-detail.tsx) -- a one-click suggestion. Never
 * auto-assigns; the CFI always confirms, same "suggest, don't act on their
 * behalf" pattern training signals themselves already use.
 */
export function AssignRadioPracticeCard({
  studentId,
  initialAssignments,
  suggestedScenarioId,
}: {
  studentId: string;
  initialAssignments: RadioPracticeAssignment[];
  suggestedScenarioId: string | null;
}) {
  const [assignments, setAssignments] = useState<RadioPracticeAssignment[]>(initialAssignments);
  const [scenarioId, setScenarioId] = useState(suggestedScenarioId ?? RADIO_PRACTICE_SCENARIOS[0]!.id);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const suggestedScenario = suggestedScenarioId ? RADIO_PRACTICE_SCENARIOS.find((s) => s.id === suggestedScenarioId) : null;

  async function assignScenario(id: string) {
    setAssigning(id);
    setError(null);
    try {
      const res = await fetch("/api/radio-practice/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id, studentId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to assign.");
      setAssignments((prev) => [data.assignment, ...prev]);
      if (id === suggestedScenarioId) setSuggestionDismissed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign.");
    } finally {
      setAssigning(null);
    }
  }

  const alreadyAssigned = new Set(assignments.map((a) => a.scenarioId));
  const showSuggestion = suggestedScenario && !suggestionDismissed && !alreadyAssigned.has(suggestedScenario.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="size-4 text-brand" />
          Radio Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showSuggestion ? (
          <div className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2.5 dark:bg-brand/10">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Flagged for radio comms -- suggest <span className="font-medium">{suggestedScenario.title}</span>?
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => assignScenario(suggestedScenario.id)} disabled={assigning === suggestedScenario.id}>
                  {assigning === suggestedScenario.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Assign this
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestionDismissed(true)}>
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={() => setSuggestionDismissed(true)}
              aria-label="Dismiss suggestion"
              className="shrink-0 rounded-full p-1 text-foreground-faint hover:bg-surface-sunken hover:text-foreground-soft"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

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
          <Button onClick={() => assignScenario(scenarioId)} disabled={assigning === scenarioId}>
            {assigning === scenarioId ? <Loader2 className="size-4 animate-spin" /> : null}
            Assign
          </Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {assignments.length === 0 ? (
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
