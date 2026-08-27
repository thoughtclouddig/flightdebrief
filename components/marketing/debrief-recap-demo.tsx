"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";

// Drop the real Deepgram-generated recap audio file at this path once it's ready.
const RECAP_AUDIO_SRC = "/audio/marketing/mia-debrief-recap.mp3";
// Shown until the real file's metadata loads (its actual runtime is ~1:04).
const FALLBACK_DURATION_SECONDS = 64;

const BAR_COUNT = 28;
// Deterministic (not Math.random) so server- and client-rendered markup match on hydration.
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = i / BAR_COUNT;
  return 0.25 + Math.abs(Math.sin(t * 11.3) * 0.5 + Math.sin(t * 3.7) * 0.3);
});

function formatTime(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Quiet, purpose-built player for a sample "Debrief Recap" -- the
 * personalized audio summary AfterFlight generates after a debrief, not a
 * replay of the original CFI/student conversation. Sits below the
 * six-card "how it works" grid as a distinct, full-width proof moment.
 */
export function DebriefRecapDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(FALLBACK_DURATION_SECONDS);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <Reveal className="mt-20">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-16 sm:py-16">
        <h3 className="font-display text-balance text-2xl font-bold text-[#101727] sm:text-3xl">
          Hear what the student takes with them.
        </h3>
        <p className="text-pretty mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#68717D]">
          After the CFI and student finish their debrief, AfterFlight turns the conversation into a personalized
          audio recap they can replay anytime.
        </p>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-[#f4f5f6] p-8 text-left sm:p-10">
          <div className="flex items-center gap-4">
            {/* A real photo (not a flat brand-orange initial) so this identity
                chip doesn't visually compete with the orange play button below it. */}
            <span className="relative size-14 shrink-0 overflow-hidden rounded-full">
              <Image src="/images/marketing/mia-headshot.jpg" alt="Mia, a student pilot" fill className="object-cover" sizes="56px" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-[#101727]">Mia&rsquo;s Debrief Recap</p>
              <p className="text-sm text-[#68717D]">Based on her conversation with Jake, her CFI</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause Mia's Recap" : "Play Mia's Recap"}
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/25 active:translate-y-0"
            >
              {playing ? <Pause className="size-6" /> : <Play className="ml-0.5 size-6" />}
            </button>

            <div className="flex h-12 min-w-0 flex-1 items-center gap-[2px]" aria-hidden="true">
              {BAR_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    "min-w-[2px] flex-1 rounded-full transition-colors duration-150",
                    i / BAR_COUNT <= progress ? "bg-brand" : "bg-slate-300",
                  )}
                  style={{ height: `${Math.max(4, h * 48)}px` }}
                />
              ))}
            </div>

            <span className="shrink-0 text-sm font-medium tabular-nums text-[#68717D]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[#68717D]/70">AfterFlight Digital Debriefer</p>
        </div>

        <p className="mt-6 text-sm font-medium text-[#68717D]">
          What went well &middot; What to improve &middot; What to study &middot; What&rsquo;s next
        </p>

        <audio ref={audioRef} src={RECAP_AUDIO_SRC} preload="metadata" />
      </div>
    </Reveal>
  );
}
