"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mic, Square, Volume2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Waveform } from "@/components/waveform";
import { useTranscription } from "@/lib/transcription";
import { playWithRadioEffect } from "@/lib/radio-effect";
import { readStoredVoice } from "@/lib/tts-voices";
import { cn } from "@/lib/utils";
import type { RadioScenario } from "@/lib/radio-practice-scenarios";
import type { RadioPracticeAssignment } from "@/lib/types";

type Phase = "ready" | "call-playing" | "call-played" | "recording" | "submitting" | "done";

interface SubmitResult {
  correct: boolean;
  matchedElements: { description: string; matched: boolean }[];
  modelReadback: string;
  transcript: string;
}

export function RadioPracticeSession({
  assignment,
  scenario,
}: {
  assignment: RadioPracticeAssignment;
  scenario: RadioScenario;
}) {
  const router = useRouter();
  const transcription = useTranscription();
  const [phase, setPhase] = useState<Phase>(assignment.status === "completed" ? "done" : "ready");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(
    assignment.status === "completed" && assignment.matchedElements
      ? {
          correct: assignment.correct ?? false,
          matchedElements: assignment.matchedElements,
          modelReadback: scenario.modelReadback,
          transcript: assignment.transcript ?? "",
        }
      : null,
  );

  const needsReadback = scenario.scoringPhrases.some((alts) => alts.length > 0);

  async function playCall() {
    setPhase("call-playing");
    setError(null);
    try {
      const res = await fetch(`/api/radio-practice/${assignment.id}/audio?voice=${readStoredVoice()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || body?.error || `Failed to load audio (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const { finished } = playWithRadioEffect(url);
      await finished;
      setPhase("call-played");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't play the ATC call -- try again.");
      setPhase("ready");
    }
  }

  async function startRecording() {
    setPhase("recording");
    await transcription.start();
  }

  async function stopAndSubmit() {
    const { transcript } = transcription.stop();
    await submit(transcript);
  }

  async function submitWithoutRecording() {
    await submit("");
  }

  /** Re-attempt the same assignment -- the submit route overwrites the previous transcript/score rather than blocking a second try. */
  function tryAgain() {
    setResult(null);
    setError(null);
    setPhase("ready");
  }

  async function submit(transcript: string) {
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/radio-practice/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to submit. Try again.");
      setResult({
        correct: data.assignment.correct,
        matchedElements: data.assignment.matchedElements,
        modelReadback: data.modelReadback,
        transcript,
      });
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Try again.");
      setPhase("call-played");
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Radio Practice</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{scenario.title}</h1>
        <p className="mt-1.5 text-base text-foreground-soft">{scenario.setup}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Button onClick={playCall} disabled={phase === "call-playing"} size="lg" className="gap-2">
            {phase === "call-playing" ? <Loader2 className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
            {phase === "call-playing" ? "Playing…" : "Play ATC Call"}
          </Button>

          {phase === "recording" ? (
            <div className="flex w-full flex-col items-center gap-3">
              <Waveform amplitude={transcription.amplitude} active={transcription.status === "recording"} />
              <p className="min-h-[2.5rem] max-w-sm text-center text-sm text-foreground-soft">
                {transcription.transcript || transcription.interimTranscript || "Listening…"}
              </p>
              <Button onClick={stopAndSubmit} variant="outline" className="gap-2">
                <Square className="size-4" /> Stop &amp; Submit
              </Button>
            </div>
          ) : phase === "call-played" ? (
            needsReadback ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="gap-2 bg-good text-white hover:bg-good/90 focus-visible:ring-good"
              >
                <Mic className="size-4" /> Record Your Readback
              </Button>
            ) : (
              <Button onClick={submitWithoutRecording} size="lg">
                Got It -- Mark Done
              </Button>
            )
          ) : null}

          {phase === "submitting" ? <Loader2 className="size-5 animate-spin text-brand" /> : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What&rsquo;s Being Checked</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1.5">
            {scenario.requiredElements.map((el, i) => {
              const matched = result?.matchedElements[i]?.matched;
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground-soft">
                  {result ? (
                    matched ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                    )
                  ) : (
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground-faint" />
                  )}
                  {el}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {result?.transcript ? (
        <Card>
          <CardHeader>
            <CardTitle>What You Said</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-soft">&ldquo;{result.transcript}&rdquo;</p>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card className={cn(result.correct ? "border-good/40 bg-good/5" : "border-danger/30 bg-danger/5")}>
          <CardContent className="flex flex-col gap-2 py-5">
            <p className={cn("font-semibold", result.correct ? "text-good" : "text-danger")}>
              {result.correct ? "Nailed it." : "Not quite -- here's a model readback:"}
            </p>
            <p className="text-sm text-foreground-soft">{result.modelReadback}</p>
            <p className="mt-1 text-xs text-foreground-faint">Source: {scenario.source}</p>
          </CardContent>
        </Card>
      ) : null}

      {phase === "done" ? (
        <div className="flex gap-2">
          {!result?.correct ? (
            <Button onClick={tryAgain} className="flex-1">
              Try Again
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => router.push("/home")} className={result?.correct ? "flex-1" : undefined}>
            Back to Home
          </Button>
        </div>
      ) : null}
    </div>
  );
}
