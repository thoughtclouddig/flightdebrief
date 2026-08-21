"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDurationShort } from "@/lib/utils";
import type { Debrief, FlightWithRelations, User } from "@/lib/types";

export interface TrainingActivityRow {
  flight: FlightWithRelations;
  student: User | null;
  debrief: Debrief | null;
}

/**
 * Client-side student filter over a CFI's debrief history -- this list only
 * grows over time (one row per debrief across the whole roster), so without
 * a way to narrow it to one student it becomes unusable past a couple dozen
 * flights.
 */
export function TrainingActivityList({ rows }: { rows: TrainingActivityRow[] }) {
  const [studentId, setStudentId] = useState("all");

  const students = useMemo(() => {
    const seen = new Map<string, string>();
    for (const { student } of rows) {
      if (student && !seen.has(student.id)) seen.set(student.id, student.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.flight.flightDate.localeCompare(a.flight.flightDate)),
    [rows],
  );

  const filtered = studentId === "all" ? sorted : sorted.filter((r) => r.student?.id === studentId);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
        <History className="size-8 text-slate-300" />
        No debriefs yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="h-9 self-start rounded-md border border-hairline bg-surface px-2.5 text-xs text-foreground"
      >
        <option value="all">All students</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          No debriefs match.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ flight, student, debrief }) => (
            <Link key={flight.id} href={`/flights/${flight.id}/debrief/results`}>
              <Card className="transition-colors hover:border-brand/40">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{student?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                      · {flight.aircraft.tailNumber} · {formatDurationShort(flight.durationMinutes)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(debrief?.structuredResult.whatWeDid ?? []).slice(0, 3).map((t, i) => (
                        <Badge key={i} variant="neutral">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
