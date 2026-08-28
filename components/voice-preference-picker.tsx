"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { TTS_VOICES, readStoredVoice, setStoredVoice } from "@/lib/tts-voices";

/**
 * Voice choice, with a sample of each. Previously this was four names and a
 * tooltip -- "American, feminine" doesn't tell you whether you want to listen
 * to it for two minutes after every flight, which is the actual decision.
 *
 * One <audio> element reused across voices rather than one each: only one can
 * play at a time anyway, and it makes "start another while one is playing"
 * fall out for free instead of needing to stop the others.
 */
export function VoicePreferencePicker() {
  const [voice, setVoice] = useState(readStoredVoice);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener("ended", () => setPlaying(null));
    audio.addEventListener("error", () => {
      setPlaying(null);
      setLoading(null);
      setError("Couldn't play that sample.");
    });
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  function choose(id: string) {
    setVoice(id);
    setStoredVoice(id);
  }

  async function toggleSample(id: string) {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);

    if (playing === id) {
      audio.pause();
      setPlaying(null);
      return;
    }

    audio.pause();
    // The first play of a voice renders server-side and takes a few seconds;
    // every later one is served from cache. Show the wait rather than leaving
    // a button that looks broken.
    setLoading(id);
    audio.src = `/api/tts/sample?voice=${encodeURIComponent(id)}`;
    try {
      await audio.play();
      setPlaying(id);
    } catch {
      setError("Couldn't play that sample.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TTS_VOICES.map((v) => {
          const isSelected = voice === v.id;
          return (
            <div
              key={v.id}
              className={cn(
                "flex items-center gap-0.5 rounded-full border p-0.5 transition-colors",
                isSelected ? "border-brand bg-brand/10" : "border-hairline bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => choose(v.id)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isSelected ? "text-foreground" : "text-foreground-soft hover:bg-surface-sunken",
                )}
              >
                {v.name}
                <span className="sr-only"> — {v.description}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSample(v.id)}
                aria-label={playing === v.id ? `Stop ${v.name} sample` : `Hear ${v.name}`}
                disabled={loading !== null && loading !== v.id}
                className="flex size-8 items-center justify-center rounded-full text-foreground-faint transition-colors hover:bg-surface-sunken hover:text-foreground disabled:opacity-50"
              >
                {loading === v.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : playing === v.id ? (
                  <Pause className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-foreground-faint">
        {TTS_VOICES.find((v) => v.id === voice)?.description}
        {" · "}
        Press play to hear a sample.
      </p>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
