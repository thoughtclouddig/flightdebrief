"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
 * One aircraft, with edit and delete. Previously the fleet was add-only --
 * a typo'd tail number or an aircraft that left the fleet was permanent.
 *
 * Delete is deliberately the secondary action. flights.aircraft_id is
 * ON DELETE RESTRICT, so the API refuses once the aircraft has flown and
 * says so; the fix in that case is marking it inactive, which is what
 * actually happens to a real aircraft that's been sold or grounded. The
 * error text points there rather than leaving a dead end.
 */
export function AircraftCard({ aircraft }: { aircraft: Aircraft }) {
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
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{aircraft.tailNumber}</p>
              <p className="text-sm text-foreground-soft">
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
                <Pencil className="size-4" />
              </button>
            </div>
          </div>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor={`tail-${aircraft.id}`}>Tail number</Label>
            <Input
              id={`tail-${aircraft.id}`}
              value={form.tailNumber}
              onChange={(e) => setForm({ ...form, tailNumber: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`base-${aircraft.id}`}>Home airport</Label>
            <Input
              id={`base-${aircraft.id}`}
              value={form.homeAirport}
              onChange={(e) => setForm({ ...form, homeAirport: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor={`make-${aircraft.id}`}>Make</Label>
            <Input
              id={`make-${aircraft.id}`}
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`model-${aircraft.id}`}>Model</Label>
            <Input
              id={`model-${aircraft.id}`}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`status-${aircraft.id}`}>Status</Label>
          <select
            id={`status-${aircraft.id}`}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Aircraft["status"] })}
            className="mt-1.5 h-12 w-full rounded-lg border border-hairline bg-surface px-4 text-base capitalize text-foreground"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              setError(null);
              setForm({
                tailNumber: aircraft.tailNumber,
                make: aircraft.make,
                model: aircraft.model,
                homeAirport: aircraft.homeAirport,
                status: aircraft.status,
              });
            }}
          >
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </div>

        <div className="border-t border-hairline pt-3">
          {confirmingDelete ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground-soft">
                Remove {aircraft.tailNumber} from the fleet? This can&rsquo;t be undone, and any upcoming bookings on
                it are cancelled. Aircraft with logged flights can&rsquo;t be deleted &mdash; mark those inactive.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={saving}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep it
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={remove} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-foreground-faint transition-colors hover:text-danger"
            >
              <Trash2 className="size-3.5" /> Delete this aircraft
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
