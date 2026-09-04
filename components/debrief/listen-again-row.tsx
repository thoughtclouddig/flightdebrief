"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { Card } from "@/components/student/ui";
import { readStoredVoice } from "@/lib/tts-voices";
import { formatAudioDuration } from "@/lib/utils";

type Status = "idle" | "loading" | "playing" | "error";

/**
 * Real TTS narration of the structured debrief (see
 * app/api/flights/[id]/debrief/audio/route.ts), in the prototype's circular
 * play-control treatment. components/listen-button.tsx is the same
 * fetch/play state machine in the old rectangular V1 style -- kept as-is for
 * its other call sites (next-lesson, the CFI/admin results branch).
 */
export function ListenAgainRow({ flightId, durationSeconds }: { flightId: string; durationSeconds: number }) {
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleClick() {
    if (status === "playing") {
      audioRef.current?.pause();
      setStatus("idle");
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setStatus("playing");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/audio?voice=${readStoredVoice()}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setStatus("idle");
      audioRef.current = audio;
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card onClick={handleClick} className="flex items-center gap-4 py-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand">
        {status === "loading" ? (
          <Loader2 className="size-4 animate-spin text-on-brand" aria-hidden />
        ) : status === "playing" ? (
          <Pause className="size-4 fill-on-brand text-on-brand" aria-hidden />
        ) : (
          <Play className="size-4 fill-on-brand text-on-brand" aria-hidden />
        )}
      </span>
      <span className="flex-1">
        <span className="block text-[17px] font-medium text-foreground">
          {status === "error" ? "Couldn't play -- try again" : "Listen again"}
        </span>
        <span className="block text-[13px] text-foreground-faint">Your debrief, {formatAudioDuration(durationSeconds)}</span>
      </span>
    </Card>
  );
}
