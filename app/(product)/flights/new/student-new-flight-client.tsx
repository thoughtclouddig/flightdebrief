"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, UserPlus } from "lucide-react";
import { Card, PageTitle, PrimaryButton, Screen, SecondaryButton, Segmented } from "@/components/prototype/ui";
import { formatDurationShort } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";
import type { FlightCandidate } from "@/lib/flight-data";

type Mode = "search" | "manual";

/** HH:MM in UTC -- matches how FR24's own app labels times, so candidates are directly comparable. */
function formatClockUtc(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

/**
 * Student-only fork of new-flight-client.tsx -- app/prototype/vector/fly is
 * the nominal design source, but that page is actually FlightRecorder, a
 * live in-flight recording UI backed by lib/flight-recording/session.ts
 * (real, tested) with no production API that accepts a completed session.
 * Wiring it would mean building a new persistence endpoint, which is
 * backend work this migration doesn't do -- so what's ported here is the
 * V2 *visual language* (Screen/Card/PrimaryButton, V2 typography and
 * spacing) applied to the two real, fully-backed ways a flight actually
 * gets created: ADS-B search and manual entry. Nothing about their logic
 * changed from new-flight-client.tsx -- same state shape, same fetch calls
 * to /api/flights, /api/flights/search and /api/student/invite-cfi, same
 * validation and error handling, read side by side against that file.
 *
 * The `students`/`studentId` CFI-roster-picker path from the shared
 * component is dropped entirely, not simplified -- it was structurally
 * always undefined for a student viewer there too (page.tsx only ever
 * passes `students` when isCfiOrAdmin), so removing it here removes no
 * real student-facing capability.
 */
export function StudentNewFlightClient({
  instructorNames,
  allowInviteCfi,
}: {
  instructorNames: string[];
  allowInviteCfi?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("search");

  return (
    <Screen>
      <PageTitle>Add a flight</PageTitle>
      <p className="-mt-4 px-1.5 text-[15px] text-foreground-soft">
        Look up recent flights by tail number, or enter the details yourself.
      </p>

      <Segmented
        options={[
          { value: "search", label: "Search by tail number" },
          { value: "manual", label: "Enter manually" },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "search" ? (
        <SearchFlow instructorNames={instructorNames} allowInviteCfi={allowInviteCfi} />
      ) : (
        <ManualForm instructorNames={instructorNames} allowInviteCfi={allowInviteCfi} />
      )}
    </Screen>
  );
}

function TextField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">{label}</span>
      {children}
    </label>
  );
}

const FIELD_CLASS =
  "h-11 w-full rounded-xl border border-hairline bg-surface px-3 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

function InstructorSelect({
  id,
  value,
  onChange,
  instructorNames,
  allowInviteCfi,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  instructorNames: string[];
  allowInviteCfi?: boolean;
}) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submitInvite() {
    if (!name.trim() || !email.trim() || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/student/invite-cfi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error ?? "Invite failed. Please try again.");
        return;
      }
      onChange(name.trim());
      setInviting(false);
      setName("");
      setEmail("");
      setNotice(data.emailSent ? `Invite sent to ${email}.` : `Added, but the invite email couldn't be sent -- share the login page with them directly.`);
      router.refresh();
    } catch {
      setNotice("Invite failed -- check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD_CLASS}>
        <option value="">No instructor</option>
        {instructorNames.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {allowInviteCfi ? (
        inviting ? (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-hairline p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input placeholder="CFI's name" value={name} onChange={(e) => setName(e.target.value)} className={FIELD_CLASS} />
              <input
                type="email"
                placeholder="CFI's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setInviting(false)}>Cancel</SecondaryButton>
              <SecondaryButton onClick={submitInvite}>
                {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                Send invite
              </SecondaryButton>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setInviting(true)}
            className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
          >
            <UserPlus className="size-3.5" aria-hidden />
            Add your CFI
          </button>
        )
      ) : null}
      {notice ? <p className="text-[13px] text-foreground-faint">{notice}</p> : null}
    </div>
  );
}

function SearchFlow({ instructorNames, allowInviteCfi }: { instructorNames: string[]; allowInviteCfi?: boolean }) {
  const router = useRouter();
  const [tail, setTail] = useState("N123AB");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<FlightCandidate[] | null>(null);
  const [selecting, setSelecting] = useState<FlightCandidate | null>(null);

  async function search() {
    if (!tail.trim() || loading) return;
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
        allowInviteCfi={allowInviteCfi}
        onBack={() => setSelecting(null)}
        onCreated={(id) => router.push(`/flights/${id}`)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <TextField id="tail" label="Tail number">
          <div className="flex gap-2">
            <input
              id="tail"
              value={tail}
              onChange={(e) => setTail(e.target.value.toUpperCase())}
              placeholder="N123AB"
              onKeyDown={(e) => e.key === "Enter" && search()}
              className={FIELD_CLASS}
            />
          </div>
        </TextField>
        <SecondaryButton onClick={search}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
          Search
        </SecondaryButton>
        {error ? <p className="text-[15px] text-danger">{error}</p> : null}
      </Card>

      {candidates ? (
        candidates.length === 0 ? (
          <p className="text-center text-[15px] text-foreground-soft">
            No recent flights found for {tail}. Some aircraft opt out of public ADS-B tracking and won&rsquo;t show
            up here even if they flew -- try entering the flight manually.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-foreground-soft">Select the flight that matches your lesson:</p>
            {candidates.map((c) => (
              <Card key={c.providerFlightId} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[17px] font-medium text-foreground">
                    {c.departureAirport} → {c.arrivalAirport}
                  </p>
                  <p className="mt-1 text-[15px] text-foreground-soft">
                    {new Date(c.scheduledDeparture).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {c.aircraftType ? ` · ${c.aircraftType}` : ""}
                  </p>
                  <p className="mt-0.5 text-[13px] text-foreground-faint">
                    {formatClockUtc(c.scheduledDeparture)}
                    {c.scheduledArrival ? ` → ${formatClockUtc(c.scheduledArrival)}` : ""}
                    {" UTC"}
                    {c.durationMinutes ? ` · ${formatDurationShort(c.durationMinutes)} flight time` : c.scheduledArrival ? "" : " · duration unknown"}
                  </p>
                </div>
                <SecondaryButton onClick={() => setSelecting(c)}>This was my flight</SecondaryButton>
              </Card>
            ))}
          </div>
        )
      ) : null}

      <p className="text-center text-[13px] text-foreground-faint">
        Flight data is contextual, sourced from ADS-B tracking -- not authoritative training telemetry.
      </p>
    </div>
  );
}

function ConfirmCandidateForm({
  candidate,
  instructorNames,
  allowInviteCfi,
  onBack,
  onCreated,
}: {
  candidate: FlightCandidate;
  instructorNames: string[];
  allowInviteCfi?: boolean;
  onBack: () => void;
  onCreated: (flightId: string) => void;
}) {
  const [instructorName, setInstructorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (saving) return;
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
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-[17px] font-medium text-foreground">
          {candidate.departureAirport} → {candidate.arrivalAirport}
        </p>
        <p className="text-[15px] text-foreground-soft">
          {candidate.tailNumber} · {new Date(candidate.scheduledDeparture).toLocaleDateString()}
        </p>
      </div>
      <TextField id="instructor" label="Instructor (optional)">
        <InstructorSelect
          id="instructor"
          value={instructorName}
          onChange={setInstructorName}
          instructorNames={instructorNames}
          allowInviteCfi={allowInviteCfi}
        />
      </TextField>
      {error ? <p className="text-[15px] text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        <SecondaryButton onClick={confirm}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Confirm flight
        </SecondaryButton>
      </div>
    </Card>
  );
}

function ManualForm({ instructorNames, allowInviteCfi }: { instructorNames: string[]; allowInviteCfi?: boolean }) {
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
    if (saving) return;
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
      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id="tailNumber" label="Tail number">
            <input
              id="tailNumber"
              value={form.tailNumber}
              onChange={(e) => set("tailNumber", e.target.value.toUpperCase())}
              required
              className={FIELD_CLASS}
            />
          </TextField>
          <TextField id="aircraftType" label="Aircraft type">
            <input
              id="aircraftType"
              value={form.aircraftType}
              onChange={(e) => set("aircraftType", e.target.value)}
              className={FIELD_CLASS}
            />
          </TextField>
          <TextField id="departureAirport" label="Departure">
            <input
              id="departureAirport"
              value={form.departureAirport}
              onChange={(e) => set("departureAirport", e.target.value.toUpperCase())}
              required
              className={FIELD_CLASS}
            />
          </TextField>
          <TextField id="arrivalAirport" label="Arrival">
            <input
              id="arrivalAirport"
              value={form.arrivalAirport}
              onChange={(e) => set("arrivalAirport", e.target.value.toUpperCase())}
              required
              className={FIELD_CLASS}
            />
          </TextField>
          <TextField id="flightDate" label="Date">
            <input
              id="flightDate"
              type="date"
              value={form.flightDate}
              onChange={(e) => set("flightDate", e.target.value)}
              required
              className={FIELD_CLASS}
            />
          </TextField>
          <TextField id="durationMinutes" label="Duration (min)">
            <input
              id="durationMinutes"
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", Number(e.target.value))}
              required
              className={FIELD_CLASS}
            />
          </TextField>
          <div className="sm:col-span-2">
            <TextField id="manual-instructor" label="Instructor (optional)">
              <InstructorSelect
                id="manual-instructor"
                value={form.instructorName}
                onChange={(v) => set("instructorName", v)}
                instructorNames={instructorNames}
                allowInviteCfi={allowInviteCfi}
              />
            </TextField>
          </div>
        </div>
        {error ? <p className="text-[15px] text-danger">{error}</p> : null}
        {/* No onClick/href -- PrimaryButton's underlying <button> then has no
            explicit type, which HTML defaults to "submit" inside a <form>,
            so this correctly triggers the form's onSubmit above. Double-
            submission is guarded in submit() itself (an early return on
            saving) rather than a disabled prop, which PrimaryButton doesn't
            expose. */}
        <PrimaryButton>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-[18px]" aria-hidden />}
          Add flight
        </PrimaryButton>
      </Card>
    </form>
  );
}
