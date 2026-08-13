"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_TTS_VOICE, TTS_VOICES, isValidTtsVoice } from "@/lib/tts-voices";

const STORAGE_KEY = "flightbrief-tts-voice";
type Status = "idle" | "loading" | "playing" | "error";

function readStoredVoice(): string {
  if (typeof window === "undefined") return DEFAULT_TTS_VOICE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isValidTtsVoice(stored) ? stored : DEFAULT_TTS_VOICE;
}

export function ListenButton({ baseSrc, label = "Listen" }: { baseSrc: string; label?: string }) {
  const [voice, setVoice] = useState(readStoredVoice);
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function changeVoice(next: string) {
    setVoice(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Any already-fetched audio was generated with the old voice -- drop it so the next click re-fetches.
    audioRef.current?.pause();
    audioRef.current = null;
    setStatus("idle");
  }

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
      const res = await fetch(`${baseSrc}?voice=${voice}`);
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
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface p-1">
        {TTS_VOICES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => changeVoice(v.id)}
            title={v.description}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              voice === v.id
                ? "bg-brand text-white"
                : "text-foreground-soft hover:bg-surface-sunken",
            )}
          >
            {v.name}
          </button>
        ))}
      </div>

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
    </div>
  );
}
