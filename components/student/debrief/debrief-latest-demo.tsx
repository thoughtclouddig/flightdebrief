"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { VectorPanel } from "@/components/student/vector-panel";
import { Card, Evidence, PrimaryButton, Section } from "@/components/student/ui";
import { DebriefDetail } from "@/components/student/debrief/debrief-detail";
import { ObjectiveComparison } from "@/components/student/debrief/assessment-comparison";
import { agreementSummary } from "@/lib/student/assessment";
import { cn } from "@/lib/utils";
import {
  ACS_AREAS,
  INSTRUCTOR,
  INSTRUCTOR_DEBRIEF,
  LAST_FLIGHT,
  PERCEPTION_GAPS,
  STRUCTURED,
  STUDENT_REFLECTION,
  SUGGESTED,
} from "@/lib/prototype-fixtures/vector-data";
import { analysisFor } from "@/lib/prototype/moments";

/** Derived from the same analysis the Flight Analysis screen renders. */
const MOMENTS = analysisFor("aug-29")?.moments ?? [];

/**
 * The completed-debrief detail demo -- shared between
 * app/prototype/vector/debrief/latest/page.tsx and
 * app/v2/debrief/latest/page.tsx. Renders the canonical shared
 * DebriefDetail hierarchy plus this demo's own bonus content ("How you
 * both saw it", Ask Vector, View transcript) as children -- see
 * DebriefDetail's own doc comment for why that content isn't part of the
 * canonical hierarchy itself (no production equivalent yet).
 */
export function DebriefLatestDemo({
  backHref,
  momentHrefBase,
  chairFlyHref,
}: {
  backHref: string;
  momentHrefBase: string;
  chairFlyHref: string;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [asking, setAsking] = useState(false);

  return (
    <DebriefDetail
      backHref={backHref}
      kicker={`${LAST_FLIGHT.date} · ${INSTRUCTOR.firstName}`}
      lessonTitle="Crosswind + Short Field"
      listenAgain={
        <Card onClick={() => {}} className="flex items-center gap-4 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand">
            <Play className="size-4 fill-on-brand text-on-brand" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-[17px] font-medium text-foreground">Listen again</span>
            <span className="block text-[13px] text-foreground-faint">Your debrief, 1:12</span>
          </span>
        </Card>
      }
      wentWell={STRUCTURED.wentWell}
      workOn={STRUCTURED.needsWork}
      acsArea={ACS_AREAS.landings}
      instructorFirstName={INSTRUCTOR.firstName}
      instructorGuidance={STRUCTURED.instructorEmphasis.map((e) => ({ instructorName: INSTRUCTOR.firstName, quote: e.quote }))}
      moments={MOMENTS.map((m) => ({
        id: m.id,
        href: `${momentHrefBase}/${m.id}`,
        title: m.title,
        type: m.type,
        flightDataLabel: m.flightData[0]?.value ?? null,
      }))}
    >
      <Section title={<>How you both saw it</>} flush>
        <p className="mb-4 text-[15px] leading-relaxed text-foreground-soft">
          {agreementSummary(PERCEPTION_GAPS.map((g) => ({ student: g.studentLevel, instructor: g.instructorLevel })))}
        </p>
        <div className="flex flex-col gap-3">
          {PERCEPTION_GAPS.map((g) => (
            <ObjectiveComparison key={g.task} task={g.task} student={g.studentLevel} instructor={g.instructorLevel} instructorName={INSTRUCTOR.firstName}>
              <Evidence label="You" tone="student" quoted={false} text={g.studentView} />
              <Evidence label={INSTRUCTOR.firstName} tone="instructor" quoted={false} text={g.instructorView} />
              {g.takeaway ? (
                <p className="rounded-xl bg-surface-sunken px-4 py-3.5 text-[15px] leading-relaxed text-foreground-soft">{g.takeaway}</p>
              ) : null}
            </ObjectiveComparison>
          ))}
        </div>
      </Section>

      {asking ? (
        <VectorPanel
          context={`${LAST_FLIGHT.lesson} · ${INSTRUCTOR.firstName} · ${LAST_FLIGHT.date}`}
          suggestions={SUGGESTED.afterDebrief}
          chairFlyHref={chairFlyHref}
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
          <div className="flex flex-col gap-6 pb-2">
            <Evidence label={INSTRUCTOR.firstName} tone="instructor" quoted={false} text={INSTRUCTOR_DEBRIEF} />
            <Evidence label="You" tone="student" quoted={false} text={STUDENT_REFLECTION} />
          </div>
        ) : null}
      </div>
    </DebriefDetail>
  );
}
