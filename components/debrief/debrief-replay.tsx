"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, CheckCircle2, ExternalLink, Pencil, Repeat, Sparkles, Target, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AcsBadge } from "@/components/acs-badge";
import { cn } from "@/lib/utils";
import type { CertificateType, StructuredDebrief } from "@/lib/types";
import type { RecurringTheme } from "@/lib/training-memory";

/**
 * The "2-minute version" of a debrief, rendered above the full detail in
 * components/debrief/debrief-result-sections.tsx (which stays unchanged
 * below this for anyone who wants the whole transcript-derived breakdown).
 * Every list here is a direct read of data the analyzer already produced --
 * no new scoring, ranking model, or fabricated content. See the "Debrief
 * Replay" plan for what's deliberately out of scope (CFI's real recorded
 * voice, tappable audio moments -- neither is possible today since raw
 * debrief audio is never stored anywhere).
 */
export function DebriefReplay({
  flightId,
  result,
  recurringTheme,
  certificateType,
  canEditCue,
  handoff,
  instructorFirstName,
}: {
  flightId: string;
  result: StructuredDebrief;
  /** At most the single strongest recurring theme -- computeNextLessonBrief already sorts by count. */
  recurringTheme: RecurringTheme | null;
  certificateType: CertificateType | null;
  /** Only the student who flew can edit their own cue/reflection. */
  canEditCue: boolean;
  /** From computeNextLessonBrief() (lib/training-memory.ts) -- open items not already covered above, so the handoff isn't just a repeat of this same debrief's own sections. */
  handoff: { keepWorkingOn: string[]; beforeFlightItems: string[] };
  /** Resolved via lib/instructor-attribution.ts. Null when this flight has no instructor assigned -- falls back to "your instructor" wherever attribution is shown. */
  instructorFirstName: string | null;
}) {
  // "Work On" is capped to the top items rather than re-ranked -- the
  // analyzer already tends to surface the most-discussed issue first, and a
  // real prioritization model is a Phase 2 concern, not a v1 blocker.
  const workOn = result.needsWork.slice(0, 2);
  const keepDoing = result.wentWell.slice(0, 3);
  const nextFlight = result.nextLessonFocus.slice(0, 3);
  const resources = result.studyReferences.slice(0, 3);
  const cfi = instructorFirstName ?? "your instructor";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            Today, In Short
          </CardTitle>
          <CardDescription>From your debrief with {cfi}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ReplayColumn label="Keep Doing" tone="good" items={keepDoing} empty="Nothing stood out." />
            <ReplayColumn label="Work On" tone="amber" items={workOn} empty="Nothing noted for this flight." />
            <ReplayColumn label="Next Flight" tone="brand" items={nextFlight} empty="No focus set yet." />
          </div>
        </CardContent>
      </Card>

      <NextFlightCueCard
        flightId={flightId}
        initialCue={result.nextFlightCue}
        context={result.nextFlightCueContext}
        editable={canEditCue}
      />

      {recurringTheme ? (
        <Card className="border-amber/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-amber" />
              Worth Extra Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm text-foreground-soft">
                <span className="font-semibold text-foreground">{recurringTheme.theme}</span> has come up in{" "}
                {recurringTheme.count} of your last {recurringTheme.consideredFlights} debriefs.
              </p>
              <AcsBadge skill={recurringTheme.skill} certificateType={certificateType} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {resources.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              Recommended Before Your Next Lesson
            </CardTitle>
            <CardDescription>Based on your debrief with {cfi}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {resources.map((ref, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">{ref.topic}</p>
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-sm text-brand hover:underline"
                  >
                    {ref.source}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-foreground-soft">{ref.source}</p>
                )}
                {ref.why ? <p className="text-xs text-foreground-faint">Why this: {ref.why}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-brand" />
            Before Your Next Flight
          </CardTitle>
          <CardDescription>Based on your debrief with {cfi}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {handoff.keepWorkingOn.length > 0 ? (
            <p className="text-sm text-foreground-soft">
              <span className="font-semibold text-foreground">Still working on:</span>{" "}
              {handoff.keepWorkingOn.join(", ")}
            </p>
          ) : null}
          {handoff.beforeFlightItems.length > 0 ? (
            <p className="text-sm text-foreground-soft">
              <span className="font-semibold text-foreground">Before you fly:</span>{" "}
              {handoff.beforeFlightItems.join(", ")}
            </p>
          ) : null}
          <Link href="/next-lesson" className={buttonVariants({ variant: "outline", className: "mt-1 w-fit" })}>
            Open Next-Lesson Brief
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

const TONE_CLASS = {
  good: "text-good",
  amber: "text-amber",
  brand: "text-brand",
} as const;

function ReplayColumn({
  label,
  tone,
  items,
  empty,
}: {
  label: string;
  tone: keyof typeof TONE_CLASS;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <p className={cn("text-xs font-bold uppercase tracking-wide", TONE_CLASS[tone])}>{label}</p>
      {items.length === 0 ? (
        <p className="mt-1.5 text-sm text-foreground-faint">{empty}</p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-foreground-soft">
              <CheckCircle2 className={cn("mt-0.5 size-3.5 shrink-0", TONE_CLASS[tone])} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The Next Flight Cue doubles as the "one thing to remember" reflection --
 * one field, one mechanism, editable inline instead of a separate quiz-like
 * step. Saves via PATCH /api/flights/[id]/debrief/cue.
 */
function NextFlightCueCard({
  flightId,
  initialCue,
  context,
  editable,
}: {
  flightId: string;
  initialCue: string;
  /** What the cue is for. Empty on debriefs analyzed before this existed -- the card just omits the line. */
  context: string;
  editable: boolean;
}) {
  const [cue, setCue] = useState(initialCue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialCue);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = draft.trim();
    setSaving(true);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/cue`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cue: trimmed }),
      });
      if (res.ok) {
        setCue(trimmed);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!cue && !editable) return null;

  return (
    <Card className="border-brand/30 bg-brand/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          Next Flight Cue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 text-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              placeholder="Airspeed → Flaps → Runway"
            />
            <button
              type="button"
              onClick={save}
              disabled={saving}
              aria-label="Save"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(cue);
                setEditing(false);
              }}
              aria-label="Cancel"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline text-foreground-soft"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {/* Names the maneuver, so a cue like "Full power. Hold brakes."
                  isn't left to be decoded a week later. */}
              {cue && context ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-faint">{context}</p>
              ) : null}
              <p className="text-lg font-semibold text-foreground">
                {cue || "What's the one thing to remember for next time?"}
              </p>
            </div>
            {editable ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit cue"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
