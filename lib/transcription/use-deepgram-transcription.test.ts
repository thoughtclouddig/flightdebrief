import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * useDeepgramTranscription drives real browser APIs (getUserMedia,
 * MediaRecorder, AudioContext) and a live WebSocket-backed SDK client --
 * this repo has no jsdom/browser-API test harness for any hook, and
 * building one just for this file would be a bigger lift than the fix
 * itself. Static source proof instead, matching this codebase's existing
 * precedent for browser/DB-coupled code too heavy to execute in a unit
 * test.
 *
 * What this proves: a real Staging test recorded a normal spoken debrief
 * and still got "insufficient_content" back. Root cause traced to stop()
 * previously reading finalChunksRef.current synchronously the instant
 * Finish is tapped -- the words spoken right before that tap are exactly
 * the ones still in flight (MediaRecorder buffers audio in 250ms chunks;
 * Deepgram's own endpointing can lag a final Transcript event by up to a
 * second or more), so the tail of a normal debrief was being silently
 * dropped before assessTranscriptAdequacy ever saw it. These assertions
 * lock in the fix's shape so a future edit can't quietly reintroduce the
 * synchronous read.
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
});

describe("useDeepgramTranscription — stop() waits for finalization before reading the transcript", () => {
  it("stop is async, not a synchronous FinishedTranscription return", () => {
    expect(SOURCE).toMatch(/const stop = useCallback\(async \(\): Promise<FinishedTranscription> => \{/);
  });

  it("flushes the recorder's currently-buffering audio chunk before finalizing", () => {
    expect(SOURCE).toMatch(/recorderRef\.current\.requestData\(\)/);
  });

  it("calls the SDK's own finalize() to flush Deepgram's server-side buffer, not requestClose() first", () => {
    expect(SOURCE).toMatch(/connectionRef\.current\?\.finalize\(\)/);
  });

  it("actually waits out a grace period for trailing final Transcript events, not fire-and-forget", () => {
    expect(SOURCE).toMatch(/await new Promise\(\(resolve\) => setTimeout\(resolve, FINALIZE_GRACE_MS\)\)/);
  });

  it("reads finalChunksRef only after the grace period, and tears down the connection only after that read", () => {
    const graceIndex = SOURCE.indexOf("await new Promise((resolve) => setTimeout(resolve, FINALIZE_GRACE_MS))");
    const readIndex = SOURCE.indexOf("const transcript = finalChunksRef.current.join(\" \");", graceIndex);
    const teardownIndex = SOURCE.indexOf("teardown();", readIndex);
    expect(graceIndex).toBeGreaterThan(-1);
    expect(readIndex).toBeGreaterThan(graceIndex);
    expect(teardownIndex).toBeGreaterThan(readIndex);
  });

  it("duration is measured before the grace period, so the wait can't pad the reported recording length", () => {
    const durationIndex = SOURCE.indexOf("const durationSeconds = Math.max(1,");
    const graceIndex = SOURCE.indexOf("await new Promise((resolve) => setTimeout(resolve, FINALIZE_GRACE_MS))");
    expect(durationIndex).toBeGreaterThan(-1);
    expect(durationIndex).toBeLessThan(graceIndex);
  });
});
