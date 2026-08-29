"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Radio practice on the home screen: what's assigned, and what's been done.
 *
 * One card with tabs rather than two stacked cards. They were separate
 * because they arrived separately -- practiced calls were added after the
 * fact -- but a reader sees one subject twice, and the second card only
 * exists at all once you've finished something, so the home page grew a
 * section as a reward for using it.
 *
 * Assigned leads because it's the thing to act on. Practiced carries the
 * result, since the calls marked Review are the reason to come back.
 */

export interface RadioCardItem {
  id: string;
  title: string;
  /** Only on practiced calls. */
  correct?: boolean;
}

export function RadioPracticeCard({
  assigned,
  practiced,
}: {
  assigned: RadioCardItem[];
  practiced: RadioCardItem[];
}) {
  // Land on whichever tab has something in it: a student with nothing
  // assigned came here to look at what they've done.
  const [tab, setTab] = useState<"assigned" | "practiced">(
    assigned.length > 0 || practiced.length === 0 ? "assigned" : "practiced",
  );

  const items = tab === "assigned" ? assigned : practiced;

  return (
    <Card className={cn(assigned.length > 0 ? "border-brand/30" : undefined)}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Radio className={cn("size-4", assigned.length > 0 && "text-brand")} />
          Radio Practice
        </CardTitle>
        {practiced.length > 0 ? (
          <div className="flex gap-1">
            {(["assigned", "practiced"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors",
                  tab === key
                    ? "bg-surface-sunken text-foreground"
                    : "text-foreground-faint hover:text-foreground-soft",
                )}
              >
                {key}
                <span className="ml-1.5 tabular-nums font-normal text-foreground-faint">
                  {key === "assigned" ? assigned.length : practiced.length}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="text-sm text-foreground-faint">
            {tab === "assigned"
              ? practiced.length > 0
                ? "Nothing new assigned. Your finished calls are under Practiced."
                : "No radio-communications practice assigned yet."
              : "Nothing practiced yet."}
          </p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/practice/${item.id}`}
              className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-sunken"
            >
              <span className="text-sm text-foreground">{item.title}</span>
              {item.correct === undefined ? (
                <span className="shrink-0 text-xs font-medium text-brand">Start →</span>
              ) : (
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    item.correct ? "text-good" : "text-danger",
                  )}
                >
                  {item.correct ? "Correct" : "Review"}
                </span>
              )}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
