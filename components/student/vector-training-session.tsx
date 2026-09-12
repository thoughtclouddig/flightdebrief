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
import type { VectorStrategy } from "@/lib/student/vector-coaching";

interface EvaluateResponse {
  evaluation: VectorCoachEvaluation;
  citation: { source: string; url: string } | null;
  strategy: VectorStrategy;
}

type Stage =
  | { kind: "asking"; retried: boolean }
  | { kind: "loading"; retried: boolean }
  | { kind: "result"; result: EvaluateResponse }
  | { kind: "error" };

/**
 * The single destination "Train with Vector" always enters.
 *
 * Nothing here is decided before the student answers: if a diagnostic
 * question is curated for this skill, Vector asks it first and the real
 * grounded evaluation of THAT answer -- not the skill code alone -- decides
 * what happens next (one more grounded round, a hand-off to the real Chair
 * Fly/Radio Practice engine, or an honest "no more ground training needed"
 * with one explicit objective to carry into the next flight). Chair Fly and
 * Radio Practice are real existing engines Vector hands off to only once
 * diagnosis calls for them, never a second choice the student has to make
 * up front. When no diagnostic question is curated at all but a rehearsal
 * engine exists, there is nothing to diagnose by text Q&A -- the activity
 * itself is the appropriate move, so Vector skips straight to it.
 */
export function VectorTrainingSession({
  skillLabel,
  isPhysicalSkill,
  evidence,
  diagnosticQuestion,
  rehearsal,
  hrefs,
  evaluateHref,
  trainHref = "/train",
}: VectorSessionProps & { evaluateHref: string; trainHref?: string }) {
  const [answer, setAnswer] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "asking", retried: false });

  async function submit(retried: boolean) {
    if (!answer.trim() || stage.kind === "loading") return;
    setStage({ kind: "loading", retried });
    try {
      const res = await fetch(evaluateHref, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, retried }),
      });
      if (!res.ok) {
        setStage({ kind: "error" });
        return;
      }
      const result = (await res.json()) as EvaluateResponse;
      setStage({ kind: "result", result });
      setAnswer("");
    } catch {
      setStage({ kind: "error" });
    }
  }

  const rehearsalCopy =
    rehearsal?.kind === "chair-fly"
      ? { eyebrow: "Let’s rehearse this", headline: "Fly it in your head first", body: "I’ll set the scene and stop at each decision point -- you fly it in your head before you fly it for real.", href: hrefs.chairFlyHref, label: "Rehearse with Vector" }
      : rehearsal?.kind === "radio-practice"
        ? { eyebrow: "Let’s practice this on the radio", headline: "Realistic ATC scenarios", body: "Graded on what you actually said, not a script -- this is the same practice a real controller would expect.", href: hrefs.radioPracticeHref, label: "Start Radio Practice" }
        : null;

  return (
    <Screen>
      <PageTitle kicker="Vector">Let&rsquo;s work on your {skillLabel.toLowerCase()}.</PageTitle>

      <div className="flex items-center px-1.5">
        <VectorMark subtitle="Your AI flight trainer" />
      </div>

      <div className="px-1.5">
        <Evidence label={evidence.label} tone="instructor" text={evidence.text} />
      </div>

      {!diagnosticQuestion && rehearsalCopy ? (
        <Panel>
          <PanelEyebrow>{rehearsalCopy.eyebrow}</PanelEyebrow>
          <PanelHeadline>{rehearsalCopy.headline}</PanelHeadline>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">{rehearsalCopy.body}</p>
          <div className="mt-5">
            <PanelButton href={rehearsalCopy.href}>{rehearsalCopy.label}</PanelButton>
          </div>
        </Panel>
      ) : null}

      {!diagnosticQuestion && !rehearsalCopy ? (
        <Panel>
          <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
            Nothing prepared for this yet -- bring it up with your instructor before your next flight.
          </p>
        </Panel>
      ) : null}

      {diagnosticQuestion && (stage.kind === "asking" || stage.kind === "loading") ? (
        <Panel>
          <PanelEyebrow>{stage.retried ? "One more try" : "One question before your next flight"}</PanelEyebrow>
          <p className="mt-2 text-[17px] leading-snug text-panel-foreground">{diagnosticQuestion.prompt}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={stage.kind === "loading"}
            placeholder="Answer in your own words…"
            rows={4}
            className="mt-4 w-full rounded-xl bg-panel-hairline/30 px-4 py-3 text-[15px] text-panel-foreground outline-none placeholder:text-panel-foreground-soft disabled:opacity-60"
          />
          <div className="mt-4">
            <PanelButton onClick={() => submit(stage.retried)} disabled={!answer.trim() || stage.kind === "loading"}>
              {stage.kind === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Checking your answer
                </span>
              ) : (
                "Get feedback"
              )}
            </PanelButton>
          </div>
        </Panel>
      ) : null}

      {diagnosticQuestion && stage.kind === "error" ? (
        <Panel>
          <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
            Couldn&rsquo;t reach Vector just now -- here&rsquo;s the idea either way: {diagnosticQuestion.explanation}
          </p>
        </Panel>
      ) : null}

      {diagnosticQuestion && stage.kind === "result" ? (
        <Panel>
          <PanelEyebrow>Feedback</PanelEyebrow>
          <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground">{stage.result.evaluation.feedback}</p>

          {stage.result.strategy.kind === "retry" ? (
            <>
              <div className="mt-5">
                <PanelEyebrow>Try it again</PanelEyebrow>
                <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground-soft">{stage.result.strategy.hint}</p>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer in your own words…"
                rows={4}
                className="mt-4 w-full rounded-xl bg-panel-hairline/30 px-4 py-3 text-[15px] text-panel-foreground outline-none placeholder:text-panel-foreground-soft"
              />
              <div className="mt-4">
                <PanelButton onClick={() => submit(true)} disabled={!answer.trim()}>
                  Get feedback
                </PanelButton>
              </div>
            </>
          ) : null}

          {stage.result.strategy.kind === "chair-fly" || stage.result.strategy.kind === "radio-practice" ? (
            <div className="mt-5">
              <PanelEyebrow>{rehearsalCopy?.eyebrow}</PanelEyebrow>
              <PanelHeadline>{rehearsalCopy?.headline}</PanelHeadline>
              <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">{rehearsalCopy?.body}</p>
              <div className="mt-5">
                <PanelButton href={rehearsalCopy?.href}>{rehearsalCopy?.label}</PanelButton>
              </div>
            </div>
          ) : null}

          {stage.result.strategy.kind === "done" ? (
            <>
              <div className="mt-5">
                <PanelEyebrow>Take this into your next flight</PanelEyebrow>
                <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground-soft">{stage.result.strategy.objective}</p>
              </div>

              {isPhysicalSkill ? (
                <p className="mt-4 text-[13px] leading-relaxed text-panel-foreground-soft">
                  This is prep to bring into the aircraft with your instructor -- not a substitute for in-aircraft instruction.
                </p>
              ) : null}

              {stage.result.citation ? (
                <p className="mt-3 text-[13px] leading-relaxed text-panel-foreground-soft">
                  Based on {stage.result.citation.source}.{" "}
                  <a href={stage.result.citation.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    View source
                  </a>
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-2.5">
                <SecondaryButton href={trainHref} onPanel>
                  Done
                </SecondaryButton>
              </div>
            </>
          ) : null}
        </Panel>
      ) : null}
    </Screen>
  );
}
