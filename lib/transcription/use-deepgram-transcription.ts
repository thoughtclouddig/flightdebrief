"use client";

import { useCallback, useRef, useState } from "react";
import type { ListenLiveClient } from "@deepgram/sdk";
import type { FinishedTranscription, TranscriptionState, TranscriptWord, UseTranscription } from "./types";

// Amplitude below this reads as room noise, not speech (same 0-1 scale as
// the waveform's own amplitude prop). Below it for SILENCE_WARNING_MS straight
// -- after an initial grace period so the first breath/pause doesn't trip it --
// most likely means the wrong input device is selected, not just a quiet room.
const SILENCE_AMPLITUDE_THRESHOLD = 0.03;
const SILENCE_GRACE_SECONDS = 4;
const SILENCE_WARNING_MS = 6000;

/**
 * Live browser mic -> Deepgram streaming STT. Uses Deepgram's documented
 * client-side streaming pattern (NEXT_PUBLIC_DEEPGRAM_API_KEY). For a real
 * deployment beyond a prototype, swap this for a server-minted short-lived
 * key instead of exposing the API key to the browser.
 */
export function useDeepgramTranscription(apiKey: string): UseTranscription {
  const [state, setState] = useState<TranscriptionState>({
    status: "idle",
    mode: "live",
    transcript: "",
    interimTranscript: "",
    amplitude: 0,
    elapsedSeconds: 0,
    error: null,
    lowAudioWarning: false,
  });

  const connectionRef = useRef<ListenLiveClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAt = useRef<number>(0);
  const finalChunksRef = useRef<string[]>([]);
  const wordsRef = useRef<TranscriptWord[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks how long amplitude has stayed near-zero so the recorder can warn
  // the CFI mid-session -- e.g. the wrong input device is selected -- instead
  // of only finding out after submitting to an empty transcript.
  const silentSinceRef = useRef<number | null>(null);

  const teardown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => {});
    connectionRef.current?.requestClose();
  }, []);

  const start = useCallback(async () => {
    finalChunksRef.current = [];
    wordsRef.current = [];
    startedAt.current = Date.now();
    silentSinceRef.current = null;
    setState((s) => ({ ...s, status: "connecting", transcript: "", interimTranscript: "", error: null, lowAudioWarning: false }));

    try {
      // Deferred until recording actually starts, not loaded just for the
      // recorder page to render -- the SDK (and its ws/transport deps) has
      // no reason to ship in the initial page bundle before the mic is
      // even requested.
      const { createClient, LiveTranscriptionEvents } = await import("@deepgram/sdk");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      tickRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (const v of dataArray) sum += Math.abs(v - 128);
        const amplitude = Math.min(1, (sum / dataArray.length / 128) * 4);
        const elapsedSeconds = Math.round((Date.now() - startedAt.current) / 1000);

        if (amplitude > SILENCE_AMPLITUDE_THRESHOLD) {
          silentSinceRef.current = null;
        } else if (silentSinceRef.current === null) {
          silentSinceRef.current = Date.now();
        }
        const silentForMs = silentSinceRef.current ? Date.now() - silentSinceRef.current : 0;
        const lowAudioWarning = elapsedSeconds >= SILENCE_GRACE_SECONDS && silentForMs >= SILENCE_WARNING_MS;

        setState((s) => ({ ...s, amplitude, elapsedSeconds, lowAudioWarning }));
      }, 100);

      const deepgram = createClient(apiKey);
      const connection = deepgram.listen.live({
        model: "nova-2",
        smart_format: true,
        interim_results: true,
        punctuate: true,
        diarize: true,
      });
      connectionRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        recorderRef.current = recorder;
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) connection.send(event.data);
        });
        recorder.start(250);
        setState((s) => ({ ...s, status: "recording" }));
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alternative = data.channel?.alternatives?.[0];
        const text: string = alternative?.transcript ?? "";
        if (!text) return;
        if (data.is_final) {
          finalChunksRef.current.push(text);
          // Deepgram's streaming word timestamps are already offsets (seconds) from
          // the start of the audio stream -- the same clock as `elapsedSeconds`.
          for (const w of alternative?.words ?? []) {
            wordsRef.current.push({
              word: w.punctuated_word ?? w.word,
              start: w.start,
              end: w.end,
              speaker: typeof w.speaker === "number" ? w.speaker : null,
            });
          }
          setState((s) => ({ ...s, transcript: finalChunksRef.current.join(" "), interimTranscript: "" }));
        } else {
          setState((s) => ({ ...s, interimTranscript: text }));
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("[Deepgram] error", err);
        setState((s) => ({ ...s, status: "error", error: "Deepgram connection error" }));
      });
    } catch (err) {
      console.error("[Deepgram] failed to start", err);
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Microphone access failed",
      }));
    }
  }, [apiKey]);

  const stop = useCallback((): FinishedTranscription => {
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const transcript = finalChunksRef.current.join(" ");
    const words = wordsRef.current;
    teardown();
    setState((s) => ({ ...s, status: "stopped", amplitude: 0, interimTranscript: "", transcript }));
    return { transcript, durationSeconds, words };
  }, [teardown]);

  return { ...state, start, stop };
}
