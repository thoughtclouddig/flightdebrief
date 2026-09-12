"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  strategy: Extract<VectorStrategy, { kind: "chair-fly" | "transfer" }>;
}

type CheckStage =
  | { kind: "asking" }
  | { kind: "loading" }
  | { kind: "result"; result: EvaluateResponse }
  | { kind: "error" };

/**
 * The single destination "Train with Vector" always enters.
 *
 * `strategy` is decided entirely server-side, before this component ever
 * renders (lib/student/vector-coaching.ts's resolveVectorStrategy) -- from
 * this unit's real observed mechanism when one exists, or from a real
 * diagnostic activity's result when one already ran, never preselected
 * from the skill code alone and never a score threshold treated as a
 * universal modality picker. This component's only job is to render
 * whichever one move that produced -- rehearse (Chair Fly, non-scored, or
 * Radio Practice, a real performance activity), coach directly from a
 * known mechanism, run the one bounded diagnostic question when nothing
 * else legitimately applies, or state the honest transfer objective. A
 * legitimate training unit never renders a dead end.
 */
export function VectorTrainingSession({
  skillLabel,
  isPhysicalSkill,
  evidence,
  strategy,
  itemId,
  radioScenarioId,
  pendingRadioPracticeAssignmentId,
  hrefs,
  evaluateHref,
  trainHref = "/train",
}: VectorSessionProps & { evaluateHref: string; trainHref?: string }) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [checkStage, setCheckStage] = useState<CheckStage>({ kind: "asking" });
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  async function submitAnswer() {
    if (!answer.trim() || checkStage.kind === "loading") return;
    setCheckStage({ kind: "loading" });
    try {
      const res = await fetch(evaluateHref, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) {
        setCheckStage({ kind: "error" });
        return;
      }
      const result = (await res.json()) as EvaluateResponse;
      setCheckStage({ kind: "result", result });
    } catch {
      setCheckStage({ kind: "error" });
    }
  }

  async function launchRadioPractice() {
    if (pendingRadioPracticeAssignmentId) {
      router.push(`/practice/${pendingRadioPracticeAssignmentId}`);
      return;
    }
    if (!radioScenarioId || launching) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const res = await fetch("/api/radio-practice/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: radioScenarioId, trainingItemId: itemId }),
      });
      const data = (await res.json().catch(() => null)) as { assignment?: { id: string }; error?: string } | null;
      if (!res.ok || !data?.assignment) throw new Error(data?.error || "Couldn't start practice.");
      router.push(`/practice/${data.assignment.id}`);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Couldn't start practice.");
      setLaunching(false);
    }
  }

  const radioCopy =
    strategy.kind === "radio-practice" && strategy.mode === "train"
      ? { eyebrow: "Let’s rehearse this on the radio", headline: "Realistic ATC scenarios", body: "Graded on what you actually said, not a script -- this is the same practice a real controller would expect." }
      : { eyebrow: "Let’s find out more", headline: "One real radio call", body: "What you actually say tells us more than describing the problem would -- respond like you would in the airplane." };

  return (
    <Screen>
      <PageTitle kicker="Vector">Let&rsquo;s work on your {skillLabel.toLowerCase()}.</PageTitle>

      <div className="flex items-center px-1.5">
        <VectorMark subtitle="Your AI flight trainer" />
      </div>

      <div className="px-1.5">
        <Evidence label={evidence.label} tone="instructor" text={evidence.text} />
      </div>

      {strategy.kind === "chair-fly" ? (
        <Panel>
          <PanelEyebrow>Let&rsquo;s rehearse this</PanelEyebrow>
          <PanelHeadline>Fly it in your head first</PanelHeadline>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
            I&rsquo;ll set the scene and stop at each decision point -- you fly it in your head before you fly it for real.
          </p>
          <div className="mt-5">
            <PanelButton href={hrefs.chairFlyHref}>Rehearse with Vector</PanelButton>
          </div>
          {isPhysicalSkill ? (
            <p className="mt-4 text-[13px] leading-relaxed text-panel-foreground-soft">
              This is prep to bring into the aircraft with your instructor -- not a substitute for in-aircraft instruction.
            </p>
          ) : null}
        </Panel>
      ) : null}

      {strategy.kind === "radio-practice" ? (
        <Panel>
          <PanelEyebrow>{radioCopy.eyebrow}</PanelEyebrow>
          <PanelHeadline>{radioCopy.headline}</PanelHeadline>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">{radioCopy.body}</p>
          {launchError ? <p className="mt-3 text-[13px] text-panel-foreground-soft">{launchError}</p> : null}
          <div className="mt-5">
            <PanelButton onClick={launchRadioPractice} disabled={launching}>
              {launching ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Starting
                </span>
              ) : pendingRadioPracticeAssignmentId ? (
                "Continue Radio Practice"
              ) : (
                "Start Radio Practice"
              )}
            </PanelButton>
          </div>
        </Panel>
      ) : null}

      {strategy.kind === "coach" ? (
        <Panel>
          <PanelEyebrow>Here&rsquo;s what to work on</PanelEyebrow>
          <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground">{strategy.message}</p>
          <div className="mt-6">
            <SecondaryButton href={trainHref} onPanel>
              Done
            </SecondaryButton>
          </div>
        </Panel>
      ) : null}

      {strategy.kind === "transfer" ? (
        <Panel>
          <PanelEyebrow>Take this into your next flight</PanelEyebrow>
          <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground">{strategy.objective}</p>
          <div className="mt-6">
            <SecondaryButton href={trainHref} onPanel>
              Done
            </SecondaryButton>
          </div>
        </Panel>
      ) : null}

      {strategy.kind === "check" ? (
        <Panel>
          {checkStage.kind === "asking" || checkStage.kind === "loading" ? (
            <>
              <PanelEyebrow>One question before your next flight</PanelEyebrow>
              <p className="mt-2 text-[17px] leading-snug text-panel-foreground">{strategy.question.prompt}</p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={checkStage.kind === "loading"}
                placeholder="Answer in your own words…"
                rows={4}
                className="mt-4 w-full rounded-xl bg-panel-hairline/30 px-4 py-3 text-[15px] text-panel-foreground outline-none placeholder:text-panel-foreground-soft disabled:opacity-60"
              />
              <div className="mt-4">
                <PanelButton onClick={submitAnswer} disabled={!answer.trim() || checkStage.kind === "loading"}>
                  {checkStage.kind === "loading" ? (
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
          ) : checkStage.kind === "error" ? (
            <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
              Couldn&rsquo;t reach Vector just now -- try again in a moment.
            </p>
          ) : (
            <>
              <PanelEyebrow>Feedback</PanelEyebrow>
              <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground">{checkStage.result.evaluation.feedback}</p>

              {checkStage.result.strategy.kind === "chair-fly" ? (
                <div className="mt-5">
                  <PanelEyebrow>Let&rsquo;s rehearse this</PanelEyebrow>
                  <PanelHeadline>Fly it in your head first</PanelHeadline>
                  <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
                    I&rsquo;ll set the scene and stop at each decision point -- you fly it in your head before you fly it for real.
                  </p>
                  <div className="mt-5">
                    <PanelButton href={hrefs.chairFlyHref}>Rehearse with Vector</PanelButton>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <PanelEyebrow>Take this into your next flight</PanelEyebrow>
                  <p className="mt-2 text-[15px] leading-relaxed text-panel-foreground-soft">
                    {checkStage.result.strategy.kind === "transfer" ? checkStage.result.strategy.objective : ""}
                  </p>
                </div>
              )}

              {checkStage.result.citation ? (
                <p className="mt-3 text-[13px] leading-relaxed text-panel-foreground-soft">
                  Based on {checkStage.result.citation.source}.{" "}
                  <a href={checkStage.result.citation.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
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
          )}
        </Panel>
      ) : null}
    </Screen>
  );
}
