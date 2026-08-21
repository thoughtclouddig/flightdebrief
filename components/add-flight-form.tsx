"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaneTakeoff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CFI/admin-only "log a flight for this student" affordance -- same
 * placement/pattern as components/schedule-lesson-form.tsx. Manual entry
 * only (no FR24 search flow, unlike app/(product)/flights/new/page.tsx) to
 * keep this compact; the caller becomes the instructor of record by
 * default, see app/api/flights/route.ts's studentId handling.
 */
export function AddFlightForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tailNumber, setTailNumber] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="self-start">
        <PlaneTakeoff className="size-4" /> Add Flight
      </Button>
    );
  }

  async function submit() {
    if (!tailNumber.trim() || !flightDate || !durationMinutes) {
      setError("Tail number, date, and duration are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          tailNumber: tailNumber.trim().toUpperCase(),
          aircraftType: aircraftType.trim() || undefined,
          departureAirport: departureAirport.trim(),
          arrivalAirport: arrivalAirport.trim(),
          flightDate,
          durationMinutes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to add flight.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add flight.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <div className="flex gap-2">
        <input
          value={tailNumber}
          onChange={(e) => setTailNumber(e.target.value)}
          placeholder="Tail number"
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
        <input
          value={aircraftType}
          onChange={(e) => setAircraftType(e.target.value)}
          placeholder="Aircraft type (optional)"
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>
      <div className="flex gap-2">
        <input
          value={departureAirport}
          onChange={(e) => setDepartureAirport(e.target.value)}
          placeholder="Departure"
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
        <input
          value={arrivalAirport}
          onChange={(e) => setArrivalAirport(e.target.value)}
          placeholder="Arrival"
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          value={flightDate}
          onChange={(e) => setFlightDate(e.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
        <input
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          placeholder="Duration (min)"
          className="min-h-11 w-32 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1" disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Add Flight"}
        </Button>
      </div>
    </div>
  );
}
