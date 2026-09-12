"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Evidence,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PageTitle,
  Screen,
  SecondaryButton,
  VectorMark,
} from "@/components/student/ui";
import type { VectorSessionProps } from "@/lib/student/vector-session-adapter";
import type { VectorCoachEvaluation } from "@/lib/ai/vector-coach";

interface EvaluateResponse {
  evaluation: VectorCoachEvaluation;
  citation: { source: string; url: string } | null;
}

/**
 * The single destination "Train with Vector" always enters. ONE training
 * focus, ONE short interaction, grounded feedback, one takeaway -- never a
 * growing transcript (VectorPanel's own rule) and never a step-player with
 * a universal shape (ChairFlySession's rule: one thing on screen at a
 * time). Chair Fly and Radio Practice are real existing engines Vector
 * hands off to here, framed first rather than surfaced as a second choice
 * the student has to make.
 */
export function VectorTrainingSession({
  skillLabel,
  isPhysicalSkill,
  evidence,
  capability,
  hasChairFlyOption,
  hrefs,
  evaluateHref,
  trainHref = "/train",
}: VectorSessionProps & { evaluateHref: string; trainHref?: string }) {
  const [answer, setAnswer] = useState("");
  const [stage, setStage] = useState<"asking" | "loading" | "done" | "error">("asking");
  const [result, setResult] = useState<EvaluateResponse | null>(null);

  async function submit() {
    if (!answer.trim() || stage === "loading") return;
    setStage("loading");
    try {
      const res = await fetch(evaluateHref, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) {
        setStage("error");
        return;
      }
      const data = (await res.json()) as EvaluateResponse;
      setResult(data);
      setStage("done");
    } catch {
      setStage("error");
    }
  }

  return (
    <Screen>
      <PageTitle kicker="Vector">Let&rsquo;s work on your {skillLabel.toLowerCase()}.</PageTitle>

      <div className="flex items-center px-1.5">
        <VectorMark subtitle="Your AI flight trainer" />
      </div>

      {evidence ? (
        <div className="px-1.5">
          <Evidence label={evidence.label} tone="instructor" text={evidence.text} />
        </div>
      ) : null}

      {capability.kind === "chair-fly" ? (
        <Panel>
          <PanelEyebrow>Let&rsquo;s rehearse this</PanelEyebrow>
          <PanelHeadline>Fly it in your head first</PanelHeadline>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
            I&rsquo;ll set the scene and stop at each decision point -- you fly it in your head before you fly it for real.
          </p>
          <div className="mt-5">
            <PanelButton href={hrefs.chairFlyHref}>Rehearse with Vector</PanelButton>
          </div>
        </Panel>
      ) : null}

      {capability.kind === "radio-practice" ? (
        <Panel>
          <PanelEyebrow>Let&rsquo;s practice this on the radio</PanelEyebrow>
          <PanelHeadline>Realistic ATC scenarios</PanelHeadline>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
            Graded on what you actually said, not a script -- this is the same practice a real controller would expect.
          </p>
          <div className="mt-5">
            <PanelButton href={hrefs.radioPracticeHref}>Start Radio Practice</PanelButton>
          </div>
        </Panel>
      ) : null}

      {capability.kind === "check" ? (
        !capability.guidance?.checkQuestion ? (
          <Panel>
            <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
              Nothing prepared for this yet -- bring it up with your instructor before your next flight.
            </p>
          </Panel>
        ) : (
          <Panel>
            {stage === "asking" || stage === "loading" ? (
              <>
                <PanelEyebrow>One question before your next flight</PanelEyebrow>
                <p className="mt-2 text-[17px] leading-snug text-panel-foreground">{capability.guidance.checkQuestion.prompt}</p>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={stage === "loading"}
                  placeholder="Answer in your own words…"
                  rows={4}
                  className="mt-4 w-full rounded-xl bg-panel-hairline/30 px-4 py-3 text-[15px] text-panel-foreground outline-none placeholder:text-panel-foreground-soft disabled:opacity-60"
                />
                <div className="mt-4">
                  <PanelButton onClick={submit} disabled={!answer.trim() || stage === "loading"}>
                    {stage === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Checking your answer
                      </span>
                    ) : (
                      "Get feedback"
                    )}
                  </PanelButton>
                </div>
              </>
            ) : stage === "error" ? (
              <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
                Couldn&rsquo;t reach Vector just now -- here&rsquo;s the idea either way: {capability.guidance.checkQuestion.explanation}
              </p>
            ) : (
              <>
                <PanelEyebrow>Feedback</PanelEyebrow>
                <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground">{result?.evaluation.feedback}</p>

                <div className="mt-5">
                  <PanelEyebrow>Take this into your next flight</PanelEyebrow>
                  <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground-soft">{result?.evaluation.takeaway}</p>
                </div>

                {isPhysicalSkill ? (
                  <p className="mt-4 text-[13px] leading-relaxed text-panel-foreground-soft">
                    This is prep to bring into the aircraft with your instructor -- not a substitute for in-aircraft instruction.
                  </p>
                ) : null}

                {result?.citation ? (
                  <p className="mt-3 text-[13px] leading-relaxed text-panel-foreground-soft">
                    Based on {result.citation.source}.{" "}
                    <a href={result.citation.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      View source
                    </a>
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-2.5">
                  {hasChairFlyOption ? <PanelButton href={hrefs.chairFlyHref}>Rehearse with Vector</PanelButton> : null}
                  <SecondaryButton href={trainHref} onPanel>
                    Done
                  </SecondaryButton>
                </div>
              </>
            )}
          </Panel>
        )
      ) : null}
    </Screen>
  );
}
