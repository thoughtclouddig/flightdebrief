"use client";

import { useCallback, useRef, useState } from "react";
import { createClient, LiveTranscriptionEvents, type ListenLiveClient } from "@deepgram/sdk";
import type { FinishedTranscription, TranscriptionState, UseTranscription } from "./types";

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
  });

  const connectionRef = useRef<ListenLiveClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAt = useRef<number>(0);
  const finalChunksRef = useRef<string[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    startedAt.current = Date.now();
    setState((s) => ({ ...s, status: "connecting", transcript: "", interimTranscript: "", error: null }));

    try {
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
        setState((s) => ({ ...s, amplitude, elapsedSeconds: Math.round((Date.now() - startedAt.current) / 1000) }));
      }, 100);

      const deepgram = createClient(apiKey);
      const connection = deepgram.listen.live({
        model: "nova-2",
        smart_format: true,
        interim_results: true,
        punctuate: true,
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
        const text: string = data.channel?.alternatives?.[0]?.transcript ?? "";
        if (!text) return;
        if (data.is_final) {
          finalChunksRef.current.push(text);
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
    teardown();
    setState((s) => ({ ...s, status: "stopped", amplitude: 0, interimTranscript: "", transcript }));
    return { transcript, durationSeconds };
  }, [teardown]);

  return { ...state, start, stop };
}
