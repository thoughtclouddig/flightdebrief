"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { FlightCard, STATUS_LABEL, STATUS_TONE } from "@/components/flight-card";
import { formatDurationShort } from "@/lib/utils";
import type { FlightWithRelations } from "@/lib/types";

type SortKey = "date-desc" | "date-asc";
type ViewMode = "grid" | "list";

function monthKey(flightDate: string): string {
  return flightDate.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Client-side filter/sort/view-toggle over a student's full flight list.
 * Fetched once server-side and handed down whole -- fine at the scale a
 * single student's training history actually reaches; revisit with
 * server-side pagination only if that stops being true.
 */
export function FlightsList({ flights }: { flights: FlightWithRelations[] }) {
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [month, setMonth] = useState("all");
  const [airport, setAirport] = useState("all");

  const months = useMemo(() => {
    const keys = Array.from(new Set(flights.map((f) => monthKey(f.flightDate)))).sort().reverse();
    return keys.map((key) => ({ key, label: monthLabel(key) }));
  }, [flights]);

  const airports = useMemo(() => {
    const set = new Set<string>();
    for (const f of flights) {
      set.add(f.departureAirport);
      set.add(f.arrivalAirport);
    }
    return Array.from(set).sort();
  }, [flights]);

  const filtered = useMemo(() => {
    let result = flights;
    if (month !== "all") result = result.filter((f) => monthKey(f.flightDate) === month);
    if (airport !== "all") result = result.filter((f) => f.departureAirport === airport || f.arrivalAirport === airport);
    result = [...result].sort((a, b) =>
      sort === "date-desc" ? b.flightDate.localeCompare(a.flightDate) : a.flightDate.localeCompare(b.flightDate),
    );
    return result;
  }, [flights, month, airport, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-lg border border-hairline bg-surface px-2.5 text-xs text-foreground"
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={airport}
          onChange={(e) => setAirport(e.target.value)}
          className="h-9 rounded-lg border border-hairline bg-surface px-2.5 text-xs text-foreground"
        >
          <option value="all">All airports</option>
          {airports.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-lg border border-hairline bg-surface px-2.5 text-xs text-foreground"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
        </select>

        <div className="ml-auto flex rounded-lg border border-hairline bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={`flex size-8 items-center justify-center rounded-md ${view === "grid" ? "bg-brand text-white" : "text-foreground-faint hover:text-foreground"}`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={`flex size-8 items-center justify-center rounded-md ${view === "list" ? "bg-brand text-white" : "text-foreground-faint hover:text-foreground"}`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline p-10 text-center text-foreground-soft">
          No flights match these filters.
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
          {filtered.map((flight) => (
            <FlightListRow key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}

function FlightListRow({ flight }: { flight: FlightWithRelations }) {
  const tone = STATUS_TONE[flight.debriefStatus];
  const href = flight.debriefStatus === "complete" ? `/flights/${flight.id}/debrief/results` : `/flights/${flight.id}`;
  const dateLabel = new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={href} className="flex items-center gap-4 bg-surface px-4 py-3 hover:bg-surface-sunken">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: tone === "open" ? "var(--brand)" : "var(--good)" }}
        aria-hidden="true"
      />
      <span className="w-24 shrink-0 text-xs text-foreground-faint">{dateLabel}</span>
      <span className="w-28 shrink-0 font-display text-sm font-bold uppercase text-foreground">
        {flight.departureAirport} → {flight.arrivalAirport}
      </span>
      <span className="hidden w-20 shrink-0 text-xs text-foreground-faint sm:block">{flight.aircraft.tailNumber}</span>
      <span className="hidden w-16 shrink-0 text-xs text-foreground-faint sm:block">
        {formatDurationShort(flight.durationMinutes)}
      </span>
      <span className="ml-auto shrink-0 text-xs font-semibold uppercase tracking-wide text-brand">
        {STATUS_LABEL[flight.debriefStatus]} →
      </span>
    </Link>
  );
}
