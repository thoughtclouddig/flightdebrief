"use client";

import { useCallback, useRef, useState } from "react";
import type { ListenLiveClient } from "@deepgram/sdk";
import type { FinishedTranscription, TranscriptionState, TranscriptWord, UseTranscription } from "./types";
import { mergeFinalAndInterim } from "./merge-transcript";

// Amplitude below this reads as room noise, not speech (same 0-1 scale as
// the waveform's own amplitude prop). Below it for SILENCE_WARNING_MS straight
// -- after an initial grace period so the first breath/pause doesn't trip it --
// most likely means the wrong input device is selected, not just a quiet room.
const SILENCE_AMPLITUDE_THRESHOLD = 0.03;
const SILENCE_GRACE_SECONDS = 4;
const SILENCE_WARNING_MS = 6000;

/**
 * Backstop only, not the primary wait. stop() first waits for Deepgram's own
 * `from_finalize: true` flag on a Results message -- the SDK's documented,
 * explicit signal that it has finished flushing everything it was holding in
 * response to our finalize() call (see stop()'s own comment). This timeout
 * only fires if that message never arrives at all (a dropped frame, a socket
 * hiccup) so "Finish Debrief" can't hang forever. It used to be the *only*
 * mechanism (a flat 1500ms sleep) -- that worked for a short debrief but
 * silently dropped most of a long, low-pause one: a real ~2-minute Staging
 * recording sat mostly as unfinalized interim text because nothing had
 * triggered Deepgram's endpointing, and 1500ms was nowhere near enough time
 * for finalize() to transcribe and return that whole backlog. Sized well
 * above a normal round trip specifically so it stays a true worst case, not
 * a second version of the same bug at a bigger number.
 */
const FINALIZE_SIGNAL_TIMEOUT_MS = 6000;

/** Counts only, never logs the words themselves -- see stop()'s diagnostic log. */
function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

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
  // Mirrors state.interimTranscript so stop() -- a useCallback that doesn't
  // re-close over every render's state -- can read the current value instead
  // of whatever was current when the hook first mounted.
  const interimTranscriptRef = useRef("");
  const wordsRef = useRef<TranscriptWord[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Resolved by the Transcript handler the moment a `from_finalize: true`
  // message arrives, or by stop()'s own backstop timeout -- whichever comes
  // first. Null whenever no finalize() call is currently awaiting a result.
  const finalizeDeferredRef = useRef<{ resolve: () => void } | null>(null);
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
    interimTranscriptRef.current = "";
    wordsRef.current = [];
    finalizeDeferredRef.current = null;
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
        // Opts this stream out of Deepgram's Model Improvement Program, so
        // the audio is retained only as long as it takes to transcribe and
        // is never used for training.
        //
        // Load-bearing, not hygiene: /data-handling and /how-it-works both
        // tell school owners that a debrief leaves no stored recording.
        // AfterFlight itself never writes one (the chunks below are streamed
        // and dropped), but without this flag the transcription provider
        // could retain what it was sent, and the promise would be true only
        // about our own database -- which is not how anyone reading it would
        // understand it.
        //
        // NOTE: opting out forgoes Deepgram's 50% MIP discount. That is a
        // deliberate trade of unit cost for a claim we can defend. Set
        // NEXT_PUBLIC_DEEPGRAM_ALLOW_MIP=true to opt back in -- and if you
        // do, correct those two pages first.
        mip_opt_out: process.env.NEXT_PUBLIC_DEEPGRAM_ALLOW_MIP !== "true",
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
        if (text) {
          if (data.is_final) {
            finalChunksRef.current.push(text);
            interimTranscriptRef.current = "";
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
            interimTranscriptRef.current = text;
            setState((s) => ({ ...s, interimTranscript: text }));
          }
        }
        // Checked independent of `text`/`is_final` -- Deepgram can send a
        // from_finalize acknowledgment with no new transcript at all (e.g.
        // nothing was pending), and it can arrive on the same message as the
        // last is_final chunk of a flush. Either way, this is the explicit
        // "finalize() is done" signal stop() is waiting for.
        if (data.from_finalize) {
          finalizeDeferredRef.current?.resolve();
          finalizeDeferredRef.current = null;
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

  const stop = useCallback(async (): Promise<FinishedTranscription> => {
    // Duration is measured now, at the moment the student actually stopped
    // talking and tapped Finish -- not after finalization below, which would
    // otherwise pad every recording's reported length.
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const liveWordCount = wordCount(mergeFinalAndInterim(finalChunksRef.current.join(" "), interimTranscriptRef.current));

    // The words spoken right before Finish is tapped are exactly the ones
    // most likely to still be in flight: MediaRecorder buffers audio in
    // 250ms chunks (recorder.start(250) above), so whatever's mid-chunk
    // hasn't reached Deepgram yet, and even audio Deepgram already has may
    // not have crossed its own endpointing threshold to come back as a
    // final Transcript event. A synchronous read of finalChunksRef here
    // systematically drops the tail of the debrief -- often the summary the
    // student just gave. requestData() flushes the recorder's current
    // buffer immediately; connection.finalize() is the SDK's own documented
    // mechanism for "flush whatever you're holding and send final results
    // for it," not a bespoke workaround. Both are fire-and-forget on their
    // own, which is why this still waits -- for Deepgram's own `from_finalize`
    // acknowledgment where possible, falling back to FINALIZE_SIGNAL_TIMEOUT_MS
    // only if that acknowledgment never arrives (see that constant's comment
    // for why a blind fixed wait alone isn't enough for a long recording).
    let signalReceived = false;
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.requestData();
      }
      if (connectionRef.current) {
        signalReceived = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            finalizeDeferredRef.current = null;
            resolve(false);
          }, FINALIZE_SIGNAL_TIMEOUT_MS);
          finalizeDeferredRef.current = {
            resolve: () => {
              clearTimeout(timeout);
              resolve(true);
            },
          };
          connectionRef.current?.finalize();
        });
      }
    } catch (err) {
      console.error("[Deepgram] finalize before stop failed:", err);
    }

    // Whatever's left in interimTranscriptRef at this point is, by
    // construction, always the tail *after* the last committed final chunk --
    // every final Transcript event clears it in the same tick (see the
    // handler above) -- so it never overlaps a final chunk from an earlier
    // utterance. It can still repeat a short run of words at the seam
    // between the two (Deepgram revising a final segment's last word or two
    // as more audio arrives); mergeFinalAndInterim accounts for that instead
    // of concatenating blindly.
    const transcript = mergeFinalAndInterim(finalChunksRef.current.join(" "), interimTranscriptRef.current);
    const finalWordCount = wordCount(transcript);
    interimTranscriptRef.current = "";
    const words = wordsRef.current;
    teardown();
    setState((s) => ({ ...s, status: "stopped", amplitude: 0, interimTranscript: "", transcript }));

    // Counts only, never transcript content -- lets a future Staging report
    // ("live transcript looked complete, but the debrief got rejected") be
    // distinguished from a genuinely thin recording without reading anyone's
    // actual words.
    console.info(
      `[Deepgram] stop(): finalize ${signalReceived ? "confirmed" : "timed out"}, live~${liveWordCount} words, returned ${finalWordCount} words`,
    );

    return { transcript, durationSeconds, words };
  }, [teardown]);

  return { ...state, start, stop };
}
