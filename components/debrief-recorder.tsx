"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingConsent } from "@/components/debrief/recording-consent";
import { Waveform } from "@/components/waveform";
import { useTranscription } from "@/lib/transcription";
import { cn } from "@/lib/utils";

export function DebriefRecorder({ flightId }: { flightId: string }) {
  const router = useRouter();
  const transcription = useTranscription();
  const [phase, setPhase] = useState<"consent" | "ready" | "recording" | "analyzing">("consent");
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (phase === "consent") {
    return <RecordingConsent flightId={flightId} onGranted={() => setPhase("ready")} />;
  }

  async function handleStart() {
    setPhase("recording");
    await transcription.start();
  }

  async function handleFinish() {
    const { transcript, durationSeconds } = transcription.stop();
    setPhase("analyzing");
    setSubmitError(null);
    try {
      const res = await fetch("/api/debrief/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightId, transcript, audioDurationSeconds: durationSeconds }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      router.push(`/flights/${flightId}/debrief/results`);
    } catch {
      setSubmitError("Something went wrong analyzing your debrief. Please try again.");
      setPhase("ready");
    }
  }

  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <p className="max-w-sm text-slate-500 dark:text-slate-400">
          Talk through the flight naturally, like you would with your instructor. No
          questionnaire -- just start talking.
        </p>
        <button
          onClick={handleStart}
          className="flex size-24 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform hover:scale-105 active:scale-95"
        >
          <Mic className="size-9" />
        </button>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Start Debrief</p>
        {transcription.mode === "mock" ? (
          <p className="text-xs text-slate-400">
            Live mic transcription needs a Deepgram key -- this demo plays back a sample debrief.
          </p>
        ) : null}
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              transcription.status === "recording" ? "text-brand" : "text-slate-400",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                transcription.status === "recording" ? "animate-pulse bg-red-500" : "bg-slate-300",
              )}
            />
            {transcription.status === "connecting" ? "Connecting…" : "Recording"}
            <span className="tabular-nums text-slate-400">
              {Math.floor(transcription.elapsedSeconds / 60)}:{(transcription.elapsedSeconds % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <Waveform amplitude={transcription.amplitude} active={transcription.status === "recording"} />

          <button
            onClick={handleFinish}
            disabled={phase === "analyzing" || transcription.status === "connecting"}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
          >
            {phase === "analyzing" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analyzing your debrief…
              </>
            ) : (
              <>
                <Square className="size-4" /> Finish Debrief
              </>
            )}
          </button>
        </CardContent>
      </Card>

      <div className="min-h-[8rem] rounded-xl border border-slate-200 bg-white p-4 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
        {transcription.transcript || transcription.interimTranscript ? (
          <p className="leading-relaxed">
            {transcription.transcript}{" "}
            <span className="text-slate-400">{transcription.interimTranscript}</span>
          </p>
        ) : (
          <p className="text-slate-400">Listening…</p>
        )}
      </div>

      {submitError ? <p className="text-center text-sm text-red-600">{submitError}</p> : null}
    </div>
  );
}
