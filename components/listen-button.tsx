"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readStoredVoice } from "@/lib/tts-voices";

type Status = "idle" | "loading" | "playing" | "error";

export function ListenButton({ baseSrc, label = "Listen" }: { baseSrc: string; label?: string }) {
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
      const res = await fetch(`${baseSrc}?voice=${readStoredVoice()}`);
      if (!res.ok) throw new Error("tts request failed");
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
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={status === "loading"}>
        {status === "loading" ? (
          <Loader2 className="animate-spin" />
        ) : status === "playing" ? (
          <Pause />
        ) : (
          <Volume2 />
        )}
        {status === "loading" ? "Loading…" : status === "playing" ? "Pause" : label}
      </Button>
      {status === "error" ? (
        <p className="text-xs text-red-500">Couldn&rsquo;t generate audio -- try again.</p>
      ) : null}
    </div>
  );
}
