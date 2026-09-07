"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Aircraft } from "@/lib/types";

const STATUS_VARIANT = {
  active: "success",
  inactive: "neutral",
  maintenance: "warning",
} as const;

const STATUSES: Aircraft["status"][] = ["active", "inactive", "maintenance"];

/**
 * School V2's Aircraft -- the real canonical CRUD (same /api/admin/aircraft
 * routes, same Repository methods, same validation and has-flights delete
 * refusal as app/(product)/admin/aircraft/page.tsx) in School V2's row
 * presentation instead of the legacy admin/aircraft-card.tsx card grid.
 * Deliberately does not add utilization, maintenance tracking, or dispatch
 * data -- none of that exists in the backend; `status` remains the same
 * cosmetic active/inactive/maintenance label canonical already has, with
 * nothing else reading it.
 */
export function SchoolV2AircraftScreen({ aircraft }: { aircraft: Aircraft[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{aircraft.length} aircraft</p>
          <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Aircraft</h1>
        </div>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[14px] font-semibold text-on-brand"
          >
            <Plus className="size-4" aria-hidden />
            Add aircraft
          </button>
        ) : null}
      </header>

      {adding ? <AddAircraftForm onDone={() => setAdding(false)} /> : null}

      {aircraft.length === 0 && !adding ? (
        <p className="py-8 text-center text-[15px] text-foreground-faint">No aircraft yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <div className="flex flex-col divide-y divide-hairline">
            {aircraft.map((a) => (
              <AircraftRow key={a.id} aircraft={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddAircraftForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ tailNumber: "", make: "", model: "", homeAirport: "" });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.tailNumber.trim() || !form.make.trim() || !form.model.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/aircraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.refresh();
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="school-aircraft-tail">Tail number</Label>
          <Input
            id="school-aircraft-tail"
            className="mt-1.5"
            value={form.tailNumber}
            onChange={(e) => setForm((f) => ({ ...f, tailNumber: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <Label htmlFor="school-aircraft-home">Home airport</Label>
          <Input
            id="school-aircraft-home"
            className="mt-1.5"
            value={form.homeAirport}
            onChange={(e) => setForm((f) => ({ ...f, homeAirport: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <Label htmlFor="school-aircraft-make">Make</Label>
          <Input
            id="school-aircraft-make"
            className="mt-1.5"
            value={form.make}
            onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="school-aircraft-model">Model</Label>
          <Input
            id="school-aircraft-model"
            className="mt-1.5"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-xl border border-hairline py-2 text-[14px] font-semibold text-foreground-soft"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-[14px] font-semibold text-on-brand disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Add
        </button>
      </div>
    </div>
  );
}

function AircraftRow({ aircraft }: { aircraft: Aircraft }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tailNumber: aircraft.tailNumber,
    make: aircraft.make,
    model: aircraft.model,
    homeAirport: aircraft.homeAirport,
    status: aircraft.status,
  });

  async function save() {
    if (!form.tailNumber.trim() || !form.make.trim()) {
      setError("Tail number and make are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/aircraft/${aircraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save the change.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the change.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/aircraft/${aircraft.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't delete this aircraft.");
      setConfirmingDelete(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this aircraft.");
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground">{aircraft.tailNumber}</p>
            <p className="text-[13px] text-foreground-soft">
              {aircraft.type} · {aircraft.homeAirport || "No home base set"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={STATUS_VARIANT[aircraft.status]}>{aircraft.status}</Badge>
            <button
              type="button"
              aria-label={`Edit ${aircraft.tailNumber}`}
              onClick={() => setEditing(true)}
              className="rounded-md p-1.5 text-foreground-faint transition-colors hover:bg-surface-sunken hover:text-foreground"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor={`school-tail-${aircraft.id}`}>Tail number</Label>
          <Input id={`school-tail-${aircraft.id}`} value={form.tailNumber} onChange={(e) => setForm({ ...form, tailNumber: e.target.value })} />
        </div>
        <div className="flex-1">
          <Label htmlFor={`school-base-${aircraft.id}`}>Home airport</Label>
          <Input id={`school-base-${aircraft.id}`} value={form.homeAirport} onChange={(e) => setForm({ ...form, homeAirport: e.target.value })} />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor={`school-make-${aircraft.id}`}>Make</Label>
          <Input id={`school-make-${aircraft.id}`} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        </div>
        <div className="flex-1">
          <Label htmlFor={`school-model-${aircraft.id}`}>Model</Label>
          <Input id={`school-model-${aircraft.id}`} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor={`school-status-${aircraft.id}`}>Status</Label>
        <select
          id={`school-status-${aircraft.id}`}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Aircraft["status"] })}
          className="mt-1.5 h-11 w-full rounded-xl border border-hairline bg-surface px-3 text-[15px] capitalize text-foreground"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-[13px] text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setError(null);
            setForm({ tailNumber: aircraft.tailNumber, make: aircraft.make, model: aircraft.model, homeAirport: aircraft.homeAirport, status: aircraft.status });
          }}
          className="flex-1 rounded-xl border border-hairline py-2 text-[14px] font-semibold text-foreground-soft"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-[14px] font-semibold text-on-brand disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Save"}
        </button>
      </div>

      <div className="border-t border-hairline pt-3">
        {confirmingDelete ? (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-foreground-soft">
              Remove {aircraft.tailNumber} from the fleet? This can&rsquo;t be undone, and any upcoming bookings on it are
              cancelled. Aircraft with logged flights can&rsquo;t be deleted &mdash; mark those inactive instead.
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => setConfirmingDelete(false)} className="flex-1 rounded-xl border border-hairline py-2 text-[13px] font-semibold text-foreground-soft">
                Keep it
              </button>
              <button type="button" onClick={remove} disabled={saving} className="flex-1 rounded-xl bg-danger py-2 text-[13px] font-semibold text-on-brand disabled:opacity-60">
                {saving ? <Loader2 className="mx-auto size-4 animate-spin" aria-hidden /> : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-faint transition-colors hover:text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden /> Delete this aircraft
          </button>
        )}
      </div>
    </div>
  );
}
