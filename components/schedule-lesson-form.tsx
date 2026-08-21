"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localIsoDate } from "@/lib/date";
import type { Aircraft } from "@/lib/types";

/** Tomorrow, not today -- a CFI scheduling from the wrap-up flow is planning the *next* lesson, not repeating today's. */
function defaultLessonDate(): string {
  return localIsoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

/** CFI/admin-only "schedule a lesson" affordance -- see Repository.createReservation's doc comment. */
export function ScheduleLessonForm({
  studentId,
  aircraft,
  autoOpen,
  caption,
  onScheduled,
  onSkip,
}: {
  studentId: string;
  aircraft: Aircraft[];
  /** Render already expanded -- used by the post-debrief wrap-up step, where there's no reason to make the CFI click to open it. */
  autoOpen?: boolean;
  /** Optional disclosure line shown above the fields, e.g. the FSP-sync caption for school orgs. */
  caption?: string;
  /** Called after a successful schedule, in addition to the router.refresh() every caller gets. */
  onScheduled?: () => void;
  /** When provided, the Cancel button becomes "Skip for now" and calls this instead of just collapsing the form. */
  onSkip?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(autoOpen));
  const [aircraftId, setAircraftId] = useState(aircraft[0]?.id ?? "");
  const [date, setDate] = useState(defaultLessonDate);
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="self-start">
        <CalendarPlus className="size-4" /> Schedule a Lesson
      </Button>
    );
  }

  async function submit() {
    if (!date || !startTime || !aircraftId) {
      setError("Date, time, and aircraft are required.");
      return;
    }
    const scheduledStart = new Date(`${date}T${startTime}`);
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60_000);

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          aircraftId,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to schedule.");
      setOpen(false);
      router.refresh();
      onScheduled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
      {caption ? <p className="text-xs text-slate-400">{caption}</p> : null}
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ accentColor: "var(--brand)" }}
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{ accentColor: "var(--brand)" }}
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={aircraftId}
          onChange={(e) => setAircraftId(e.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        >
          {aircraft.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tailNumber} · {a.type}
            </option>
          ))}
        </select>
        <select
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="min-h-11 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        >
          <option value={60}>1.0 hr</option>
          <option value={90}>1.5 hr</option>
          <option value={120}>2.0 hr</option>
        </select>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSkip ?? (() => setOpen(false))}
          className="flex-1"
          disabled={saving}
        >
          {onSkip ? "Skip for now" : "Cancel"}
        </Button>
        <Button size="sm" onClick={submit} className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Schedule"}
        </Button>
      </div>
    </div>
  );
}
