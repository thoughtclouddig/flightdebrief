"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCog, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Aircraft, Reservation, User } from "@/lib/types";

/** "2026-08-28T16:00:00.000Z" -> the date/time inputs' local-clock strings. */
function toLocalParts(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/**
 * Reschedule or cancel an existing lesson. Previously a booking could only be
 * created -- a CFI who picked the wrong slot, or whose student moved, had no
 * way to correct it short of leaving a wrong time on both dashboards.
 *
 * Cancel is a status change, not a delete (see Repository.cancelReservation),
 * and is confirmed inline rather than with a browser dialog so the
 * consequence is stated in the app's own words.
 */
export function RescheduleLessonForm({
  reservation,
  aircraft,
  instructors = [],
}: {
  reservation: Reservation;
  aircraft: Aircraft[];
  /** Picker renders only when there's more than one, same rule as scheduling. */
  instructors?: Pick<User, "id" | "name">[];
}) {
  const router = useRouter();
  const initial = toLocalParts(reservation.scheduledStart);
  const durationMinutes = Math.max(
    30,
    Math.round((new Date(reservation.scheduledEnd).getTime() - new Date(reservation.scheduledStart).getTime()) / 60_000),
  );

  const [open, setOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [date, setDate] = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.time);
  const [duration, setDuration] = useState(durationMinutes);
  const [aircraftId, setAircraftId] = useState(reservation.aircraftId);
  const [instructorId, setInstructorId] = useState(reservation.instructorId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!date || !startTime) {
      setError("Date and time are required.");
      return;
    }
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(start.getTime() + duration * 60_000);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
          aircraftId,
          instructorId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save the change.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the change.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelLesson() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't cancel the lesson.");
      setOpen(false);
      setConfirmingCancel(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't cancel the lesson.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="mt-2 self-start">
        <CalendarCog className="size-4" /> Reschedule or cancel
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-hairline p-3">
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ accentColor: "var(--brand)" }}
          className="min-h-11 flex-1 rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground dark:[color-scheme:dark]"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{ accentColor: "var(--brand)" }}
          className="min-h-11 flex-1 rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground dark:[color-scheme:dark]"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={aircraftId}
          onChange={(e) => setAircraftId(e.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm"
        >
          {aircraft.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tailNumber} · {a.type}
            </option>
          ))}
        </select>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="min-h-11 rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm"
        >
          <option value={60}>1.0 hr</option>
          <option value={90}>1.5 hr</option>
          <option value={120}>2.0 hr</option>
        </select>
      </div>

      {instructors.length > 1 ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Instructor</span>
          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="min-h-11 rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm"
          >
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1" disabled={saving}>
          Close
        </Button>
        <Button size="sm" onClick={save} className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>
      </div>

      <div className="border-t border-hairline pt-2">
        {confirmingCancel ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-foreground-soft">
              Cancel this lesson? It disappears from both dashboards. Anything already debriefed is unaffected.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingCancel(false)}
                className="flex-1"
                disabled={saving}
              >
                Keep it
              </Button>
              <Button variant="destructive" size="sm" onClick={cancelLesson} className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Cancel lesson"}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground-faint hover:text-danger"
          >
            <X className="size-3.5" /> Cancel this lesson
          </button>
        )}
      </div>
    </div>
  );
}
