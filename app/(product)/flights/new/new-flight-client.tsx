"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search, PlaneTakeoff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDurationShort } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";
import type { FlightCandidate } from "@/lib/flight-data";

type Mode = "search" | "manual";

function InstructorSelect({
  id,
  value,
  onChange,
  instructorNames,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  instructorNames: string[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-900"
    >
      <option value="">No instructor</option>
      {instructorNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}

export function NewFlightClient({ instructorNames }: { instructorNames: string[] }) {
  const [mode, setMode] = useState<Mode>("search");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Add a flight</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Look up recent flights by tail number, or enter the details yourself.
        </p>
      </div>

      <div className="flex rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
        {(["search", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-medium transition-colors",
              mode === m
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5",
            )}
          >
            {m === "search" ? "Search by tail number" : "Enter manually"}
          </button>
        ))}
      </div>

      {mode === "search" ? <SearchFlow instructorNames={instructorNames} /> : <ManualForm instructorNames={instructorNames} />}
    </div>
  );
}

function SearchFlow({ instructorNames }: { instructorNames: string[] }) {
  const router = useRouter();
  const [tail, setTail] = useState("N123AB");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<FlightCandidate[] | null>(null);
  const [selecting, setSelecting] = useState<FlightCandidate | null>(null);

  async function search() {
    if (!tail.trim()) return;
    setLoading(true);
    setError(null);
    setCandidates(null);
    try {
      const res = await fetch(`/api/flights/search?tail=${encodeURIComponent(tail.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setCandidates(data.candidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't search for that tail number. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (selecting) {
    return (
      <ConfirmCandidateForm
        candidate={selecting}
        instructorNames={instructorNames}
        onBack={() => setSelecting(null)}
        onCreated={(id) => router.push(`/flights/${id}`)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="tail">Tail number</Label>
          <div className="flex gap-2">
            <Input
              id="tail"
              value={tail}
              onChange={(e) => setTail(e.target.value.toUpperCase())}
              placeholder="N123AB"
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="flex-1"
            />
            <Button onClick={search} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Search
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      {candidates ? (
        candidates.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No recent flights found for {tail}. Some aircraft opt out of public ADS-B tracking and won&rsquo;t show
            up here even if they flew -- try entering the flight manually.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Select the flight that matches your lesson:</p>
            {candidates.map((c) => (
              <Card key={c.providerFlightId}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      <PlaneTakeoff className="size-4 text-brand" />
                      {c.departureAirport} → {c.arrivalAirport}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(c.scheduledDeparture).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {new Date(c.scheduledDeparture).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {c.durationMinutes ? ` · ${formatDurationShort(c.durationMinutes)}` : ""}
                      {c.aircraftType ? ` · ${c.aircraftType}` : ""}
                    </p>
                    {!c.departureAirport && !c.arrivalAirport ? (
                      <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                        No resolved airports for this leg -- may have limited or no track data.
                      </p>
                    ) : null}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setSelecting(c)}>
                    This was my flight
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      <p className="text-center text-xs text-slate-400">
        Flight data is contextual, sourced from ADS-B tracking -- not authoritative training telemetry.
      </p>
    </div>
  );
}

function ConfirmCandidateForm({
  candidate,
  instructorNames,
  onBack,
  onCreated,
}: {
  candidate: FlightCandidate;
  instructorNames: string[];
  onBack: () => void;
  onCreated: (flightId: string) => void;
}) {
  const [instructorName, setInstructorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailNumber: candidate.tailNumber,
          aircraftType: candidate.aircraftType ?? undefined,
          departureAirport: candidate.departureAirport,
          arrivalAirport: candidate.arrivalAirport,
          flightDate: candidate.scheduledDeparture.slice(0, 10),
          durationMinutes: candidate.durationMinutes ?? 60,
          instructorName: instructorName || undefined,
          providerFlightId: candidate.providerFlightId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.flight) {
        setError(data.error ?? "Failed to add this flight. Please try again.");
        return;
      }
      onCreated(data.flight.id);
    } catch {
      setError("Failed to add this flight -- check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {candidate.departureAirport} → {candidate.arrivalAirport}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {candidate.tailNumber} · {new Date(candidate.scheduledDeparture).toLocaleDateString()}
          </p>
        </div>
        <div>
          <Label htmlFor="instructor">Instructor (optional)</Label>
          <InstructorSelect id="instructor" value={instructorName} onChange={setInstructorName} instructorNames={instructorNames} />
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={confirm} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm flight
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ManualForm({ instructorNames }: { instructorNames: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    tailNumber: "N123AB",
    aircraftType: "Diamond DA40 NG",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: localIsoDate(),
    durationMinutes: 75,
    instructorName: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, instructorName: form.instructorName || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.flight) {
        setError(data.error ?? "Failed to add this flight. Please try again.");
        setSaving(false);
        return;
      }
      router.push(`/flights/${data.flight.id}`);
    } catch {
      setError("Failed to add this flight -- check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tail number">
              <Input value={form.tailNumber} onChange={(e) => set("tailNumber", e.target.value.toUpperCase())} required />
            </Field>
            <Field label="Aircraft type">
              <Input value={form.aircraftType} onChange={(e) => set("aircraftType", e.target.value)} />
            </Field>
            <Field label="Departure">
              <Input value={form.departureAirport} onChange={(e) => set("departureAirport", e.target.value.toUpperCase())} required />
            </Field>
            <Field label="Arrival">
              <Input value={form.arrivalAirport} onChange={(e) => set("arrivalAirport", e.target.value.toUpperCase())} required />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.flightDate} onChange={(e) => set("flightDate", e.target.value)} required />
            </Field>
            <Field label="Duration (min)">
              <Input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", Number(e.target.value))}
                required
              />
            </Field>
            <div className="col-span-2">
              <Field label="Instructor (optional)">
                <InstructorSelect
                  id="manual-instructor"
                  value={form.instructorName}
                  onChange={(v) => set("instructorName", v)}
                  instructorNames={instructorNames}
                />
              </Field>
            </div>
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Add flight
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
