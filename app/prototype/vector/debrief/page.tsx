"use client";

import { useState } from "react";
import { Check, ChevronDown, Play } from "lucide-react";
import { VectorPanel } from "@/components/prototype/vector-panel";
import { Card, Evidence, PageTitle, PrimaryButton, Screen, Section, SectionLabel } from "@/components/prototype/ui";
import { cn } from "@/lib/utils";
import {
  INSTRUCTOR,
  INSTRUCTOR_DEBRIEF,
  LAST_FLIGHT,
  STRUCTURED,
  STUDENT_REFLECTION,
  SUGGESTED,
} from "@/lib/prototype/vector-data";

/**
 * Debrief answers: what happened last flight?
 *
 * Copy is aggressively shortened -- the seeded strings are full sentences
 * because the analyzer produces sentences, but a list on a phone wants
 * phrases. Long form is one tap away in the transcript, which stays closed.
 */
const WENT_WELL = ["Better centerline control", "Strong short-field technique"];
const WORK_ON = ["Crosswind correction through touchdown", "Stabilized approach speed"];

export default function DebriefPage() {
  const [showTranscript, setShowTranscript] = useState(false);
  const [asking, setAsking] = useState(false);

  return (
    <Screen>
      <PageTitle kicker={`${LAST_FLIGHT.date} · ${INSTRUCTOR.firstName}`}>Debrief</PageTitle>

      <Card onClick={() => {}} className="flex items-center gap-4 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand">
          <Play className="size-4 fill-brand-foreground text-brand-foreground" />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-medium text-foreground">Listen again</span>
          <span className="block text-[13px] text-foreground-faint">Your debrief, 1:12</span>
        </span>
      </Card>

      <Section>
        <SectionLabel>Went well</SectionLabel>
        <ul className="flex flex-col gap-3">
          {WENT_WELL.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <Check className="mt-1 size-4 shrink-0 text-good" />
              {w}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionLabel>Work on</SectionLabel>
        <ul className="flex flex-col gap-3">
          {WORK_ON.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber" />
              {w}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionLabel>{INSTRUCTOR.firstName} wants next</SectionLabel>
        <div className="flex flex-col gap-3">
          {STRUCTURED.instructorEmphasis.map((e) => (
            <Evidence key={e.quote} label={INSTRUCTOR.firstName} tone="instructor" text={e.quote} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionLabel>Where you and {INSTRUCTOR.firstName} landed</SectionLabel>
        <Card className="flex flex-col gap-4">
          <Evidence label="You" tone="student" text="Crosswinds felt pretty good." />
          <Evidence
            label={INSTRUCTOR.firstName}
            tone="instructor"
            text="Centerline improved. Correction still needs consistency through touchdown."
          />
          <p className="rounded-xl bg-surface-sunken px-4 py-3.5 text-[15px] leading-relaxed text-foreground-soft">
            You both saw progress. {INSTRUCTOR.firstName} still wants more consistency through touchdown.
          </p>
        </Card>
      </Section>

      {asking ? (
        <VectorPanel
          context={`${LAST_FLIGHT.lesson} · ${INSTRUCTOR.firstName} · ${LAST_FLIGHT.date}`}
          suggestions={SUGGESTED.afterDebrief}
        />
      ) : (
        <PrimaryButton onClick={() => setAsking(true)}>Ask Vector about this</PrimaryButton>
      )}

      <div>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex min-h-[44px] w-full items-center gap-2 text-[15px] font-medium text-foreground-faint"
        >
          View transcript
          <ChevronDown className={cn("size-4 transition-transform", showTranscript && "rotate-180")} />
        </button>
        {showTranscript ? (
          <div className="flex flex-col gap-4 pb-2">
            <Evidence label={INSTRUCTOR.firstName} tone="instructor" quoted={false} text={INSTRUCTOR_DEBRIEF} />
            <Evidence label="You" tone="student" quoted={false} text={STUDENT_REFLECTION} />
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
