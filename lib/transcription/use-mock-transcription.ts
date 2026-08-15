"use client";

import { useCallback, useRef, useState } from "react";
import type { FinishedTranscription, TranscriptionState, TranscriptWord, UseTranscription } from "./types";

const DEFAULT_MOCK_TRANSCRIPT =
  "We started with some pattern work. My first landing was pretty rough. I was carrying too much speed and floated. The next two were better. We also practiced a go-around. Radio calls were much better today, but I missed one instruction from tower and had to ask for a repeat.";

/**
 * Plays back a canned transcript at a natural speaking pace, with a
 * synthetic waveform, so the debrief flow works with zero external services.
 */
export function useMockTranscription(scriptedTranscript?: string): UseTranscription {
  const script = scriptedTranscript ?? DEFAULT_MOCK_TRANSCRIPT;
  const [state, setState] = useState<TranscriptionState>({
    status: "idle",
    mode: "mock",
    transcript: "",
    interimTranscript: "",
    amplitude: 0,
    elapsedSeconds: 0,
    error: null,
  });

  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const startedAt = useRef<number>(0);
  const finalTranscriptRef = useRef("");
  const wordsRef = useRef<TranscriptWord[]>([]);
  const WORD_INTERVAL_SECONDS = 0.18;

  const clearTimers = () => {
    timers.current.forEach(clearInterval);
    timers.current = [];
  };

  const start = useCallback(async () => {
    clearTimers();
    finalTranscriptRef.current = "";
    wordsRef.current = [];
    startedAt.current = Date.now();
    setState((s) => ({ ...s, status: "connecting", transcript: "", interimTranscript: "", error: null }));

    await new Promise((r) => setTimeout(r, 500));
    setState((s) => ({ ...s, status: "recording" }));

    const words = script.split(" ");
    let i = 0;
    let buffer = "";

    const wordTimer = setInterval(() => {
      if (i >= words.length) {
        clearInterval(wordTimer);
        return;
      }
      buffer = buffer ? `${buffer} ${words[i]}` : words[i];
      wordsRef.current.push({
        word: words[i],
        start: i * WORD_INTERVAL_SECONDS,
        end: (i + 1) * WORD_INTERVAL_SECONDS,
        speaker: null,
      });
      i++;
      finalTranscriptRef.current = buffer;
      setState((s) => ({ ...s, transcript: buffer, interimTranscript: "" }));
    }, 180);
    timers.current.push(wordTimer);

    const amplitudeTimer = setInterval(() => {
      setState((s) => ({
        ...s,
        amplitude: s.status === "recording" ? 0.15 + Math.random() * 0.75 : 0,
        elapsedSeconds: Math.round((Date.now() - startedAt.current) / 1000),
      }));
    }, 120);
    timers.current.push(amplitudeTimer);
  }, [script]);

  const stop = useCallback((): FinishedTranscription => {
    clearTimers();
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const finalTranscript = finalTranscriptRef.current || script;
    setState((s) => ({
      ...s,
      status: "stopped",
      amplitude: 0,
      transcript: finalTranscript,
      interimTranscript: "",
    }));
    return { transcript: finalTranscript, durationSeconds, words: wordsRef.current };
  }, [script]);

  return { ...state, start, stop };
}
