import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * useDeepgramTranscription drives real browser APIs (getUserMedia,
 * MediaRecorder, AudioContext) and a live WebSocket-backed SDK client --
 * this repo has no jsdom/browser-API test harness for any hook, and
 * building one just for this file would be a bigger lift than the fix
 * itself. Static source proof instead, matching this codebase's existing
 * precedent for browser/DB-coupled code too heavy to execute in a unit
 * test. The event-ordering/reconciliation logic this bug actually hinges
 * on lives in mergeFinalAndInterim (lib/transcription/merge-transcript.ts),
 * which IS a pure function and IS exercised with real inputs/outputs in
 * merge-transcript.test.ts -- read that file for the actual behavioral
 * coverage of the failure mode, not this one.
 *
 * History: a real Staging test recorded a normal ~2-minute spoken debrief
 * and still got "insufficient_content" back, despite an earlier fix
 * (commit 7414324) that made stop() wait a flat 1500ms before reading
 * finalChunksRef. That fix addressed a bounded ~1s tail-drop; it did
 * nothing for a long, low-pause recording where most of the transcript
 * sat as unfinalized interim text because Deepgram's endpointing hadn't
 * fired -- 1500ms was nowhere near enough time for finalize() to
 * transcribe and return that whole backlog. This file's assertions lock
 * in the shape of the actual fix: stop() now waits for Deepgram's own
 * `from_finalize` acknowledgment (an explicit completion signal) with a
 * bounded timeout only as a backstop, and reconciles any leftover interim
 * text into the returned transcript instead of discarding it.
 */
const SOURCE = readFileSync(new URL("./use-deepgram-transcription.ts", import.meta.url), "utf8");

describe("useDeepgramTranscription — every final segment accumulates, none get overwritten", () => {
  it("pushes each final Transcript event onto finalChunksRef rather than reassigning it", () => {
    expect(SOURCE).toMatch(/finalChunksRef\.current\.push\(text\)/);
    expect(SOURCE).not.toMatch(/finalChunksRef\.current\s*=\s*\[text\]/);
  });

  it("only resets finalChunksRef when a new recording actually starts, never mid-recording", () => {
    const resets = SOURCE.match(/finalChunksRef\.current\s*=\s*\[\];/g) ?? [];
    // Exactly one reset -- inside start(), at the top of a fresh session.
    expect(resets.length).toBe(1);
    const resetIndex = SOURCE.indexOf("finalChunksRef.current = [];");
    const startIndex = SOURCE.indexOf("const start = useCallback(");
    const stopIndex = SOURCE.indexOf("const stop = useCallback(");
    expect(resetIndex).toBeGreaterThan(startIndex);
    expect(resetIndex).toBeLessThan(stopIndex);
  });

  it("clears interimTranscriptRef the instant its content is promoted to final, so leftover interim never overlaps an earlier final chunk", () => {
    const finalBranchIndex = SOURCE.indexOf("if (data.is_final) {");
    const clearIndex = SOURCE.indexOf('interimTranscriptRef.current = "";', finalBranchIndex);
    const nextBranchIndex = SOURCE.indexOf("} else {", finalBranchIndex);
    expect(finalBranchIndex).toBeGreaterThan(-1);
    expect(clearIndex).toBeGreaterThan(finalBranchIndex);
    expect(clearIndex).toBeLessThan(nextBranchIndex);
  });
});

describe("useDeepgramTranscription — stop() waits for an explicit finalize signal, not only a blind timeout", () => {
  it("stop is async, not a synchronous FinishedTranscription return", () => {
    expect(SOURCE).toMatch(/const stop = useCallback\(async \(\): Promise<FinishedTranscription> => \{/);
  });

  it("flushes the recorder's currently-buffering audio chunk before finalizing", () => {
    expect(SOURCE).toMatch(/recorderRef\.current\.requestData\(\)/);
  });

  it("calls the SDK's own finalize() to flush Deepgram's server-side buffer, not requestClose() first", () => {
    expect(SOURCE).toMatch(/connectionRef\.current\?\.finalize\(\)/);
  });

  it("resolves the finalize wait from the explicit from_finalize event, not only from a timer", () => {
    expect(SOURCE).toMatch(/if \(data\.from_finalize\) \{/);
    expect(SOURCE).toMatch(/finalizeDeferredRef\.current\?\.resolve\(\)/);
  });

  it("still has a bounded backstop timeout in case from_finalize never arrives", () => {
    expect(SOURCE).toMatch(/const timeout = setTimeout\(\(\) => \{/);
    expect(SOURCE).toMatch(/FINALIZE_SIGNAL_TIMEOUT_MS/);
  });

  it("cancels the backstop timeout once the explicit signal resolves, so it never also fires afterward", () => {
    expect(SOURCE).toMatch(/clearTimeout\(timeout\)/);
  });

  it("reads finalChunksRef/interimTranscriptRef only after the finalize wait resolves, and tears down the connection only after that read", () => {
    const waitIndex = SOURCE.indexOf("connectionRef.current?.finalize();");
    const readIndex = SOURCE.indexOf("const transcript = mergeFinalAndInterim(", waitIndex);
    const teardownIndex = SOURCE.indexOf("teardown();", readIndex);
    expect(waitIndex).toBeGreaterThan(-1);
    expect(readIndex).toBeGreaterThan(waitIndex);
    expect(teardownIndex).toBeGreaterThan(readIndex);
  });

  it("duration is measured before the finalize wait, so it can't pad the reported recording length", () => {
    const durationIndex = SOURCE.indexOf("const durationSeconds = Math.max(1,");
    const waitIndex = SOURCE.indexOf("connectionRef.current?.finalize();");
    expect(durationIndex).toBeGreaterThan(-1);
    expect(durationIndex).toBeLessThan(waitIndex);
  });

  it("resolves the returned transcript through mergeFinalAndInterim instead of reading finalChunksRef alone, so leftover interim text isn't silently dropped", () => {
    expect(SOURCE).toMatch(/import \{ mergeFinalAndInterim \} from "\.\/merge-transcript";/);
    expect(SOURCE).toMatch(/const transcript = mergeFinalAndInterim\(finalChunksRef\.current\.join\(" "\), interimTranscriptRef\.current\);/);
  });

  it("resets both finalChunksRef and interimTranscriptRef when a new recording starts, so retry state can't leak from a prior attempt", () => {
    const startIndex = SOURCE.indexOf("const start = useCallback(");
    const stopIndex = SOURCE.indexOf("const stop = useCallback(");
    const startBody = SOURCE.slice(startIndex, stopIndex);
    expect(startBody).toMatch(/finalChunksRef\.current = \[\];/);
    expect(startBody).toMatch(/interimTranscriptRef\.current = "";/);
    expect(startBody).toMatch(/finalizeDeferredRef\.current = null;/);
  });

  it("logs only word counts on stop(), never the transcript content itself", () => {
    const logIndex = SOURCE.indexOf("console.info(");
    expect(logIndex).toBeGreaterThan(-1);
    const logCall = SOURCE.slice(logIndex, SOURCE.indexOf(");", logIndex));
    expect(logCall).toMatch(/words/);
    expect(logCall).not.toMatch(/\btranscript\b(?!Ref)/);
  });
});
