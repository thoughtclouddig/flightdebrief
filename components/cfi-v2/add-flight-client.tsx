"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlaneTakeoff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDurationShort } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";
import { trackEvent } from "@/lib/marketing/analytics";
import type { FlightCandidate } from "@/lib/flight-data";

type Mode = "search" | "manual";

/** HH:MM in UTC -- matches how FR24's own app labels times, so candidates are directly comparable. */
function formatClockUtc(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

/**
 * Where a successful flight creation sends the CFI -- a single exported,
 * pure function rather than duplicating the template string in both
 * SearchFlow's and ManualForm's success handlers, so the "stays inside CFI
 * V2" contract is one tested implementation, not two copies that could
 * silently drift (e.g. one getting fixed after a regression, the other not).
 */
export function cfiV2AddFlightDestination(studentId: string): string {
  return `/cfi-v2/students/${studentId}`;
}

/**
 * CFI V2's Add Flight -- reuses the exact same search/manual-entry business
 * logic, validation, and API contracts (`GET /api/flights/search`,
 * `POST /api/flights`) as the legacy CFI/admin flow
 * (app/(product)/flights/new/new-flight-client.tsx), written fresh against
 * CFI V2's own presentation primitives instead of embedding or restyling
 * that page. Replaces the "Log a flight for [student]" link that used to
 * send the CFI to that legacy page entirely (see the doc comment on
 * components/cfi-v2/student-detail-screen.tsx's link).
 *
 * The student is fixed by the route (/cfi-v2/students/[id]/flights/new),
 * not picked from a dropdown -- unlike the legacy flow, which also serves
 * "log for any student on the roster" from a bare /flights/new, this screen
 * only ever launches from one student's own record. No instructor field
 * either: POST /api/flights already makes the authenticated CFI the
 * instructor of record whenever `studentId` is present (see that route's
 * own comment), so there is nothing to pick.
 */
export function CfiV2AddFlightClient({ studentId, studentFirstName }: { studentId: string; studentFirstName: string }) {
  const [mode, setMode] = useState<Mode>("search");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-full border border-hairline bg-surface p-1">
        {(["search", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-full py-2 text-[14px] font-semibold transition-colors",
              mode === m ? "bg-brand text-white" : "text-foreground-soft hover:bg-surface-sunken",
            )}
          >
            {m === "search" ? "Search by tail number" : "Enter manually"}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <SearchFlow studentId={studentId} studentFirstName={studentFirstName} />
      ) : (
        <ManualForm studentId={studentId} />
      )}
    </div>
  );
}

function SearchFlow({ studentId, studentFirstName }: { studentId: string; studentFirstName: string }) {
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
        studentId={studentId}
        onBack={() => setSelecting(null)}
        onCreated={() => router.push(cfiV2AddFlightDestination(studentId))}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
        <Label htmlFor="tail">Tail number</Label>
        <div className="mt-1.5 flex gap-2">
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
        {error ? <p className="mt-2 text-[14px] text-danger">{error}</p> : null}
      </div>

      {candidates ? (
        candidates.length === 0 ? (
          <p className="text-center text-[14px] text-foreground-faint">
            No recent flights found for {tail}. Double-check the tail number, or enter the flight manually if it
            still doesn&rsquo;t turn up.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-foreground-faint">Select the flight that matches {studentFirstName}&rsquo;s lesson:</p>
            {candidates.map((c) => (
              <div
                key={c.providerFlightId}
                className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4"
              >
                <div>
                  <p className="flex items-center gap-2 text-[15px] font-medium text-foreground">
                    <PlaneTakeoff className="size-4 text-brand" />
                    {c.departureAirport} → {c.arrivalAirport}
                  </p>
                  <p className="mt-1 text-[14px] text-foreground-faint">
                    {new Date(c.scheduledDeparture).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {c.aircraftType ? ` · ${c.aircraftType}` : ""}
                  </p>
                  <p className="mt-0.5 text-[13px] text-foreground-faint">
                    {formatClockUtc(c.scheduledDeparture)}
                    {c.scheduledArrival ? ` → ${formatClockUtc(c.scheduledArrival)}` : ""}
                    {" UTC"}
                    {c.durationMinutes ? ` · ${formatDurationShort(c.durationMinutes)} flight time` : c.scheduledArrival ? "" : " · duration unknown"}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setSelecting(c)}>
                  This was the flight
                </Button>
              </div>
            ))}
          </div>
        )
      ) : null}

      <p className="text-center text-[12px] text-foreground-faint">
        Flight data is contextual, sourced from ADS-B tracking -- not authoritative training telemetry.
      </p>
    </div>
  );
}

function ConfirmCandidateForm({
  candidate,
  studentId,
  onBack,
  onCreated,
}: {
  candidate: FlightCandidate;
  studentId: string;
  onBack: () => void;
  onCreated: (flightId: string) => void;
}) {
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
          providerFlightId: candidate.providerFlightId,
          studentId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.flight) {
        setError(data.error ?? "Failed to add this flight. Please try again.");
        return;
      }
      trackEvent("flight_created", {
        creation_method: "adsb",
        has_instructor: true,
        duration_minutes: candidate.durationMinutes ?? 60,
      });
      onCreated(data.flight.id);
    } catch {
      setError("Failed to add this flight -- check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4">
      <div>
        <p className="text-[15px] font-medium text-foreground">
          {candidate.departureAirport} → {candidate.arrivalAirport}
        </p>
        <p className="text-[14px] text-foreground-faint">
          {candidate.tailNumber} · {new Date(candidate.scheduledDeparture).toLocaleDateString()}
        </p>
      </div>
      {error ? <p className="text-[14px] text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={confirm} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirm flight
        </Button>
      </div>
    </div>
  );
}

function ManualForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    tailNumber: "N123AB",
    aircraftType: "Diamond DA40 NG",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: localIsoDate(),
    durationMinutes: 75,
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
        body: JSON.stringify({ ...form, studentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.flight) {
        setError(data.error ?? "Failed to add this flight. Please try again.");
        setSaving(false);
        return;
      }
      trackEvent("flight_created", { creation_method: "manual", has_instructor: true, duration_minutes: form.durationMinutes });
      router.push(cfiV2AddFlightDestination(studentId));
    } catch {
      setError("Failed to add this flight -- check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      {error ? <p className="text-[14px] text-danger">{error}</p> : null}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Add flight
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-foreground-soft">{label}</span>
      {children}
    </label>
  );
}
