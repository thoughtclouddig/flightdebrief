"use client";

import { useState } from "react";
import { Check, ChevronDown, Play } from "lucide-react";
import { VectorPanel } from "@/components/prototype/vector-panel";
import {
  AcsBadge,
  BackLink,
  Card,
  Evidence,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
} from "@/components/prototype/ui";
import { cn } from "@/lib/utils";
import {
  ACS_AREAS,
  INSTRUCTOR,
  INSTRUCTOR_DEBRIEF,
  LAST_FLIGHT,
  STRUCTURED,
  STUDENT_REFLECTION,
  SUGGESTED,
} from "@/lib/prototype/vector-data";

/**
 * One debrief, answering: what happened last flight?
 *
 * Copy is aggressively shortened -- the seeded strings are full sentences
 * because the analyzer produces sentences, but a list on a phone wants
 * phrases. Long form is one tap away in the transcript, which stays closed.
 */
const WENT_WELL = ["Better centerline control", "Strong short-field technique"];
const WORK_ON = ["Crosswind correction through touchdown", "Stabilized approach speed"];

export default function DebriefDetail() {
  const [showTranscript, setShowTranscript] = useState(false);
  const [asking, setAsking] = useState(false);

  return (
    <Screen>
      <BackLink href="/prototype/vector/debrief">Debriefs</BackLink>
      <PageTitle kicker={`${LAST_FLIGHT.date} · ${INSTRUCTOR.firstName}`}>Crosswind + Short Field</PageTitle>

      <Card onClick={() => {}} className="flex items-center gap-4 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand">
          <Play className="size-4 fill-on-brand text-on-brand" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-medium text-foreground">Listen again</span>
          <span className="block text-[13px] text-foreground-faint">Your debrief, 1:12</span>
        </span>
      </Card>

      <Section title={<>Went well</>}>
        <ul className="flex flex-col gap-3">
          {WENT_WELL.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <Check className="mt-1 size-4 shrink-0 text-state-good" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={<>Work on</>}>
        <ul className="flex flex-col gap-3">
          {WORK_ON.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-attention" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
        {/* ACS as a structural footnote: one line saying this is a recognized
            Area of Operation, then out of the way. */}
        <AcsBadge area={ACS_AREAS.landings} />
      </Section>

      <Section title={<>{INSTRUCTOR.firstName} wants next</>}>
        <div className="flex flex-col gap-3">
          {STRUCTURED.instructorEmphasis.map((e) => (
            <Evidence key={e.quote} label={INSTRUCTOR.firstName} tone="instructor" text={e.quote} />
          ))}
        </div>
      </Section>

      <Section title={<>Where you and {INSTRUCTOR.firstName} landed</>} flush>
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
          aria-expanded={showTranscript}
          className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 text-[15px] font-medium text-foreground-faint"
        >
          View transcript
          <ChevronDown className={cn("size-4 transition-transform duration-200", showTranscript && "rotate-180")} aria-hidden />
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
