"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, PageTitle, Screen } from "@/components/student/ui";
import { LocalDateTime } from "@/components/local-date-time";
import { cn, formatDurationShort } from "@/lib/utils";
import type { CfiV2RosterEntry, RosterStatusTone } from "@/lib/cfi-v2/roster";

const TONE_CLASS: Record<RosterStatusTone, string> = {
  attention: "bg-amber/15 text-amber-ink",
  waiting: "bg-surface-sunken text-foreground-soft",
  good: "bg-good/15 text-good-ink",
};

/**
 * CFI V2's roster -- scanning-first, not an account list: focus, last
 * activity, next lesson, and one plain-language status per student instead
 * of raw enum values. See lib/cfi-v2/roster.ts for how the status is
 * derived from the same computeInstructorRoster/attentionReasons logic V1
 * uses, just recomposed for a single line per card.
 */
export function CfiV2RosterScreen({ roster }: { roster: CfiV2RosterEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((entry) => entry.studentName.toLowerCase().includes(q));
  }, [roster, query]);

  return (
    <Screen>
      <PageTitle kicker={`${roster.length} on your roster`}>Students</PageTitle>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-faint" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students"
          className="h-11 w-full rounded-xl border border-hairline bg-surface pl-10 pr-3 text-[15px] text-foreground placeholder:text-foreground-faint"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-foreground-faint">No students match.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <Link key={entry.studentId} href={`/cfi-v2/students/${entry.studentId}`}>
              <Card className="transition-colors hover:border-foreground-faint/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[16px] font-semibold text-foreground">
                      {entry.studentName}
                      {entry.isPrimary ? <span className="text-[12px] font-medium text-foreground-faint">Primary</span> : null}
                    </p>
                    <p className="mt-1 text-[14px] text-foreground-soft">
                      {entry.lastActivity
                        ? `Last flew ${formatShortDate(entry.lastActivity.flightDate)} · ${formatDurationShort(entry.lastActivity.durationMinutes)}`
                        : "No flights yet"}
                    </p>
                    {entry.nextLesson ? (
                      <p className="mt-0.5 text-[14px] font-medium text-brand">
                        Next: <LocalDateTime iso={entry.nextLesson.scheduledStart} options={{ weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }} />
                      </p>
                    ) : null}
                    {entry.currentFocus.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {entry.currentFocus.slice(0, 3).map((f, i) => (
                          <span key={i} className="rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] font-medium text-foreground-soft">
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span className={cn("shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-semibold", TONE_CLASS[entry.statusTone])}>
                    {entry.statusLabel}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  );
}

function formatShortDate(flightDate: string): string {
  return new Date(flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
