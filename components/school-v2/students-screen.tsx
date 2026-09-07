"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { SchoolAttentionItem } from "@/lib/school-v2/overview";
import type { SchoolV2RosterEntry } from "@/lib/school-v2/roster";
import { formatFlightDate } from "@/lib/utils";

interface InstructorOption {
  id: string;
  name: string;
}

/**
 * School V2's student roster -- compact rows, not a spreadsheet. One row is
 * enough to answer "who is this, who teaches them, what are they working
 * on, when did they last fly, do they need attention" without opening the
 * student. Search and the instructor filter are client-side since the
 * whole roster is already fetched (a school's real size, not a paginated
 * account list).
 */
export function SchoolV2StudentsScreen({
  roster,
  instructors,
  attentionByStudentId,
}: {
  roster: SchoolV2RosterEntry[];
  instructors: InstructorOption[];
  attentionByStudentId: Map<string, SchoolAttentionItem>;
}) {
  const [query, setQuery] = useState("");
  const [instructorId, setInstructorId] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((entry) => {
      if (instructorId && entry.primaryInstructorId !== instructorId) return false;
      if (q && !entry.student.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roster, query, instructorId]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{roster.length} students</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Students</h1>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students"
            className="h-11 w-full rounded-xl border border-hairline bg-surface pl-10 pr-3 text-[15px] text-foreground placeholder:text-foreground-faint"
          />
        </div>
        <select
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          className="h-11 rounded-xl border border-hairline bg-surface px-3 text-[15px] text-foreground sm:w-56"
        >
          <option value="">All instructors</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-foreground-faint">No students match.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <div className="flex flex-col divide-y divide-hairline">
            {filtered.map((entry) => {
              const attention = attentionByStudentId.get(entry.student.id);
              return (
                <Link
                  key={entry.student.id}
                  href={`/school-v2/students/${entry.student.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-foreground">{entry.student.name}</p>
                    <p className="mt-0.5 text-[13px] text-foreground-soft">
                      With {entry.primaryInstructorName}
                      {entry.mostRecentFlight ? ` · Last flew ${formatFlightDate(entry.mostRecentFlight.flightDate)}` : " · No flights yet"}
                    </p>
                    {entry.currentFocus.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {entry.currentFocus.slice(0, 3).map((f, i) => (
                          <span key={i} className="rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] font-medium text-foreground-soft">
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {attention ? (
                    <span className="shrink-0 whitespace-nowrap rounded-md bg-amber-soft px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-amber-ink">
                      Needs attention
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
