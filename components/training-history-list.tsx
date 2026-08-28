"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDurationShort } from "@/lib/utils";
import type { Debrief, FlightWithRelations } from "@/lib/types";

export interface TrainingHistoryRow {
  flight: FlightWithRelations;
  debrief: Debrief | null;
}

/**
 * Client-side topic filter over a student's own debrief history -- unlike
 * the CFI roster view (filtered by student), a single student's list only
 * grows longer over time within one identity, so the dimension worth
 * narrowing by is what was actually covered, not who it belongs to.
 */
export function TrainingHistoryList({ rows }: { rows: TrainingHistoryRow[] }) {
  const [topic, setTopic] = useState("all");

  const topics = useMemo(() => {
    const seen = new Set<string>();
    for (const { debrief } of rows) {
      for (const t of debrief?.structuredResult.whatWeDid ?? []) seen.add(t);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = topic === "all" ? rows : rows.filter((r) => r.debrief?.structuredResult.whatWeDid.includes(topic));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
        <History className="size-8 text-slate-300" />
        No debriefed flights yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {topics.length > 1 ? (
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="h-9 self-start rounded-md border border-hairline bg-surface px-2.5 text-xs text-foreground"
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          No flights covered this topic.
        </div>
      ) : (
        <ol className="relative flex flex-col gap-8 border-l border-slate-200 pl-6 dark:border-white/10">
          {filtered.map(({ flight, debrief }) => (
            <li key={flight.id} className="relative">
              <span className="absolute -left-[29px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-brand dark:border-[#0a0e17]" />
              <Link href={`/flights/${flight.id}/debrief/results`} className="group">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-brand dark:text-white">
                  {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  <span className="ml-2 font-normal text-slate-400">
                    {flight.aircraft.tailNumber} · {formatDurationShort(flight.durationMinutes)}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(debrief?.structuredResult.whatWeDid ?? []).map((t, i) => (
                    <Badge key={i} variant="neutral" className={t === topic ? "ring-1 ring-brand" : undefined}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
