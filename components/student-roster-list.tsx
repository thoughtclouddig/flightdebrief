"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatDurationShort } from "@/lib/utils";
import type { StudentRosterEntry } from "@/lib/training-memory";
import { LocalDateTime } from "@/components/local-date-time";

type Filter = "all" | "active" | "upcoming" | "needs_debrief" | "recently_flown";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "needs_debrief", label: "Needs Debrief" },
  { key: "recently_flown", label: "Recently Flown" },
];

const RECENT_DAYS = 14;

function matchesFilter(entry: StudentRosterEntry, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "active") return entry.status === "active";
  if (filter === "upcoming") return entry.nextReservation !== null;
  if (filter === "needs_debrief") return entry.pendingFlight !== null;
  if (filter === "recently_flown") {
    if (!entry.mostRecentFlight) return false;
    const days = (Date.now() - new Date(entry.mostRecentFlight.flightDate).getTime()) / (1000 * 60 * 60 * 24);
    return days <= RECENT_DAYS;
  }
  return true;
}

export function StudentRosterList({ roster }: { roster: StudentRosterEntry[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster
      .filter((entry) => matchesFilter(entry, filter))
      .filter((entry) => !q || entry.student.name.toLowerCase().includes(q));
  }, [roster, query, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students"
          className="pl-10"
        />
      </div>

      {/* One scrolling row rather than wrapping to a second line: a filter set
          reads as a single control, and a lone orphaned pill underneath looks
          like a different thing. The negative margin + matching padding let
          pills bleed to the screen edge so it's obvious there's more to
          scroll, and scrollbar-none keeps that invisible on desktop. */}
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          No students match.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <Link key={entry.student.id} href={`/cfi/students/${entry.student.id}`}>
              <Card className="transition-colors hover:border-brand/40">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      {entry.student.name}
                      {entry.isPrimary ? <Badge variant="neutral">Primary</Badge> : null}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {entry.mostRecentFlight
                        ? `Last flew ${new Date(entry.mostRecentFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${formatDurationShort(entry.mostRecentFlight.durationMinutes)}`
                        : "No flights yet"}
                    </p>
                    {entry.nextReservation ? (
                      <p className="mt-0.5 text-sm font-medium text-brand">
                        Next:{" "}
                        <LocalDateTime
                          iso={entry.nextReservation.scheduledStart}
                          options={{ weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                        />
                      </p>
                    ) : null}
                    {entry.currentFocus.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.currentFocus.slice(0, 3).map((f, i) => (
                          <Badge key={i} variant="neutral">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Badge variant={entry.pendingFlight ? "warning" : entry.mostRecentFlight ? "success" : "neutral"}>
                    {entry.pendingFlight ? "Needs debrief" : entry.mostRecentFlight ? "Debriefed" : "No flights"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
