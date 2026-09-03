"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AssessmentProgress } from "@/components/debrief/assessment-progress";
import { PerformanceLevelPicker } from "@/components/debrief/performance-level-picker";
import { Card, PageTitle, PrimaryButton, Screen, SectionLabel } from "@/components/prototype/ui";
import { partitionTasks } from "@/lib/universal-tasks";
import { formatFlightContext } from "@/lib/utils";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import type { FlightWithRelations } from "@/lib/types";

interface TaskInput {
  id: string;
  label: string;
  taskCode: string;
}

/**
 * Student fork of components/debrief/assessment-form.tsx -- that component
 * is shared with the CFI's instructor-assessment page (role="instructor"),
 * so it's left completely untouched; this preserves its exact rate()/
 * submit() logic and the same two API routes
 * (/assessments/[role]/ratings, /assessments/[role]/submit), always called
 * with role="student" here since self-assessment/page.tsx is already
 * hard-gated to the flight's own student (viewer.user.id !== flight.userId
 * -> notFound()).
 *
 * PerformanceLevelPicker and AssessmentProgress are reused unmodified --
 * both are small, real, already token-based, and shared with the CFI side;
 * only the surrounding chrome (Card/PageTitle) and the removed shadcn
 * dependency changed.
 */
export function StudentAssessmentForm({
  flightId,
  flight,
  tasks,
  initialRatings,
  redirectTo,
  title,
  helpText,
}: {
  flightId: string;
  flight: FlightWithRelations;
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
  const { lesson, universal } = partitionTasks(tasks);

  async function rate(taskId: string, level: PerformanceLevelCode) {
    setRatings((r) => ({ ...r, [taskId]: level }));
    setSaving(taskId);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/assessments/student/ratings`, {
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
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/assessments/student/submit`, {
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
    <Screen>
      <div>
        <p className="text-[15px] text-foreground-faint">{formatFlightContext(flight)}</p>
        <PageTitle>{title}</PageTitle>
      </div>
      <p className="-mt-4 px-1.5 text-[15px] leading-relaxed text-foreground-soft">{helpText}</p>

      <AssessmentProgress rated={ratedCount} total={tasks.length} />

      <div className="flex flex-col gap-3">
        {lesson.map((task) => (
          <Card key={task.id} className="flex flex-col gap-3.5">
            <p className="text-[17px] font-semibold text-foreground">{task.label}</p>
            <PerformanceLevelPicker value={ratings[task.id] ?? null} onChange={(level) => rate(task.id, level)} disabled={saving === task.id} />
          </Card>
        ))}
      </div>

      {universal.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="px-1.5">
            <SectionLabel>Every flight</SectionLabel>
            <p className="mt-1 text-[15px] text-foreground-soft">These happen whatever the lesson was, so they are rated every time.</p>
          </div>
          {universal.map((task) => (
            <Card key={task.id} className="flex flex-col gap-3.5">
              <p className="text-[17px] font-semibold text-foreground">{task.label}</p>
              <PerformanceLevelPicker value={ratings[task.id] ?? null} onChange={(level) => rate(task.id, level)} disabled={saving === task.id} />
            </Card>
          ))}
        </div>
      ) : null}

      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Anything else worth noting about the flight overall? (optional)"
        rows={3}
        className="w-full rounded-xl border border-hairline bg-surface p-3 text-[15px] text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {error ? <p className="text-[15px] text-danger">{error}</p> : null}

      {/* PrimaryButton has no disabled prop -- the wrapping opacity
          preserves the same "not ready yet" affordance the original
          shadcn Button's disabled:opacity-50 gave, without changing
          ui.tsx. */}
      <div className={allRated && !submitting ? undefined : "pointer-events-none opacity-50"}>
        <PrimaryButton onClick={submit}>
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Submit assessment
        </PrimaryButton>
      </div>
    </Screen>
  );
}
