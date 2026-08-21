"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssessmentProgress } from "@/components/debrief/assessment-progress";
import { TaskRatingCard } from "@/components/debrief/task-rating-card";
import { formatFlightContext } from "@/lib/utils";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import type { AssessmentRole, FlightWithRelations } from "@/lib/types";

interface TaskInput {
  id: string;
  label: string;
}

export function AssessmentForm({
  flightId,
  flight,
  role,
  tasks,
  initialRatings,
  redirectTo,
  title,
  helpText,
}: {
  flightId: string;
  /** Optional -- when provided, shown above the title so it's always clear which flight this assessment is for. */
  flight?: FlightWithRelations;
  role: AssessmentRole;
  tasks: TaskInput[];
  initialRatings: Record<string, PerformanceLevelCode>;
  redirectTo: string;
  title: string;
  helpText: string;
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, PerformanceLevelCode>>(initialRatings);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratedCount = Object.keys(ratings).length;
  const allRated = ratedCount === tasks.length;

  async function rate(taskId: string, level: PerformanceLevelCode) {
    setRatings((r) => ({ ...r, [taskId]: level }));
    setSaving(taskId);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/assessments/${role}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightTaskId: taskId, level }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("Couldn't save that rating -- check your connection and try again.");
    } finally {
      setSaving(null);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/assessments/${role}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overallReflection: reflection || null }),
      });
      if (!res.ok) throw new Error();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Couldn't submit your assessment -- check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        {flight ? (
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            {formatFlightContext(flight)}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-foreground-soft">{helpText}</p>
      </div>

      <AssessmentProgress rated={ratedCount} total={tasks.length} />

      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskRatingCard
            key={task.id}
            label={task.label}
            value={ratings[task.id] ?? null}
            onChange={(level) => rate(task.id, level)}
            disabled={saving === task.id}
          />
        ))}
      </div>

      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Anything else worth noting about the flight overall? (optional)"
        rows={3}
        className="w-full rounded-lg border border-hairline bg-transparent p-3 text-sm text-foreground placeholder:text-foreground-soft focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <Button size="lg" onClick={submit} disabled={!allRated || submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit assessment
      </Button>
    </div>
  );
}
