"use client";

import { useState } from "react";
import { Armchair, ArrowRight, Check, PlaneTakeoff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  Evidence,
  PageTitle,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  PrimaryButton,
  Section,
  VectorMark,
} from "@/components/prototype/ui";
import type { ChairFlyDrill, ChairFlyOption } from "@/lib/prototype/chair-fly";

/**
 * Guided chair flying.
 *
 * One prompt at a time, and the previous prompt is GONE. The earlier version
 * of this screen was a chat log that grew downward with a text input at the
 * bottom, which made the drill a conversation about the maneuver rather than
 * a rehearsal of it -- the student ends up composing sentences for a machine
 * instead of sitting in the airplane. Tap and reveal, one situation on
 * screen, nothing to scroll back to.
 *
 * NOTHING HERE IS SCORED. There is no counter, no correct/incorrect styling,
 * no summary of how many the student got right, and no state that could
 * become one. Choosing an option produces coaching and then the next
 * situation. The product has exactly one performance model and Chair Flying
 * only reads it.
 */
export function ChairFlySession({ drill }: { drill: ChairFlyDrill }) {
  const [stage, setStage] = useState<"intro" | "running" | "complete">("intro");
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<ChairFlyOption | null>(null);

  const step = drill.steps[index];

  function advance() {
    setChosen(null);
    if (index + 1 >= drill.steps.length) {
      setStage("complete");
      return;
    }
    setIndex(index + 1);
  }

  if (stage === "intro") {
    return (
      <>
        <PageTitle kicker="Chair fly">{drill.objective}</PageTitle>

        <Panel>
          <PanelEyebrow icon={<Armchair className="size-3.5" aria-hidden />}>Why this drill</PanelEyebrow>
          {/* The reason IS the perception gap. A student who thinks the thing
              went fine will never choose to rehearse it, so the drill has to
              arrive with the disagreement attached. */}
          <PanelHeadline>
            You called it {drill.reason.studentLabel}. {drill.reason.instructorName} called it{" "}
            {drill.reason.instructorLabel}.
          </PanelHeadline>
          <PanelMeta>
            {drill.scenario} · about {drill.estimatedMinutes} minutes
          </PanelMeta>

          <div className="mt-5">
            <Evidence
              label={`${drill.reason.instructorName} · ${drill.reason.date}`}
              tone="instructor"
              text={drill.reason.evidence}
              onPanel
            />
          </div>

          <div className="mt-6">
            <PanelButton onClick={() => setStage("running")}>
              Begin
              <ArrowRight className="size-[18px]" aria-hidden />
            </PanelButton>
          </div>
        </Panel>

        <Section title={<>How this works</>}>
          <VectorMark
            subtitle="Your AI flight trainer"
            context={`Vector sets the situation and asks what you'd do. ${drill.steps.length} of them, starting where your last flight ended.`}
          />
          {/* One sentence, and it is the last thing read before Begin. */}
          <p className="mt-4 border-t border-hairline pt-4 text-[14px] leading-relaxed text-foreground-faint">
            {drill.guardrail}
          </p>
        </Section>
      </>
    );
  }

  if (stage === "complete") {
    return (
      <>
        <Panel>
          <PanelEyebrow icon={<Check className="size-3.5" aria-hidden />}>Chair flying complete</PanelEyebrow>
          <PanelHeadline>{drill.objective}</PanelHeadline>
          <PanelMeta>{drill.scenario}</PanelMeta>
        </Panel>

        {/* Two or three things, not a recap of the drill. If a student
            remembers one sentence on Thursday it should be one of these. */}
        <Section title={<>Remember next flight</>}>
          <ul className="flex flex-col gap-3.5">
            {drill.carryForward.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </Section>

        {/* The rehearsal has to visibly land somewhere, or it was homework. */}
        <Section title={<>Next flight</>}>
          <div className="flex items-start gap-3.5">
            <PlaneTakeoff className="mt-1 size-[18px] shrink-0 text-brand" aria-hidden />
            <div className="min-w-0">
              <p className="text-[17px] font-medium text-foreground">
                {drill.nextFlight.when} · {drill.nextFlight.lesson}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-foreground-soft">Focus: {drill.nextFlight.focus}</p>
            </div>
          </div>
        </Section>

        <PrimaryButton href="/prototype/vector">
          See my next flight
          <ArrowRight className="size-[18px]" aria-hidden />
        </PrimaryButton>
      </>
    );
  }

  if (!step) return null;

  return (
    <>
      {/* Position, not progress toward a mark. Text only, deliberately: a
          filled rail here would read as the skill meter, which is the one
          visual in this product that does carry an assessment. */}
      <p className="text-[14px] font-medium tabular-nums text-foreground-faint">
        Step {index + 1} of {drill.steps.length}
      </p>

      <Card className="flex flex-col gap-5">
        <p className="text-[17px] leading-relaxed text-foreground-soft">{step.scene}</p>
        <p className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{step.prompt}</p>

        <div className="flex flex-col gap-2.5">
          {step.options.map((o) => {
            const picked = chosen?.id === o.id;
            return (
              <button
                key={o.id}
                onClick={() => !chosen && setChosen(o)}
                disabled={Boolean(chosen)}
                aria-pressed={picked}
                className={cn(
                  "min-h-[52px] cursor-pointer rounded-2xl border px-4 py-3 text-left text-[16px] leading-snug transition-colors duration-200",
                  // No right/wrong colouring. The chosen option is marked as
                  // chosen and nothing else -- Vector's words carry whether
                  // the reasoning holds up.
                  picked
                    ? "border-foreground bg-surface-sunken text-foreground"
                    : chosen
                      ? "border-hairline text-foreground-faint"
                      : "border-hairline text-foreground hover:border-foreground-faint/50",
                )}
              >
                {o.text}
              </button>
            );
          })}
        </div>

        {chosen ? (
          <div className="flex flex-col gap-5 border-t border-hairline pt-5">
            <Evidence label="Vector" tone="vector" quoted={false} text={chosen.response} />

            {/* The one beat that is literally the instructor's note gets his
                name on it. Vector never speaks in the instructor's voice. */}
            {step.instructorNote ? (
              <Evidence
                label={`${drill.reason.instructorName} · ${drill.reason.date}`}
                tone="instructor"
                text={step.instructorNote}
              />
            ) : null}

            <p className="rounded-xl bg-surface-sunken px-4 py-3.5 text-[15px] leading-relaxed text-foreground-soft">
              {step.coaching}
            </p>
          </div>
        ) : null}
      </Card>

      {chosen ? (
        <PrimaryButton onClick={advance}>
          {index + 1 >= drill.steps.length ? "Finish" : "Continue"}
          <ArrowRight className="size-[18px]" aria-hidden />
        </PrimaryButton>
      ) : null}
    </>
  );
}
