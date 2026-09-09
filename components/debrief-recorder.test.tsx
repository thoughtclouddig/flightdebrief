import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * DebriefRecorder is a "use client" component wired to real mic/WebSocket
 * APIs via useTranscription() -- see lib/transcription/use-deepgram-
 * transcription.test.ts for why this repo has no practical way to execute
 * it in a unit test. Static source proof that this caller actually awaits
 * the now-async stop() (see that file) instead of treating its return
 * value as synchronous, and that the UI is disabled before the finalize
 * wait starts, not after.
 */
const SOURCE = readFileSync(new URL("./debrief-recorder.tsx", import.meta.url), "utf8");

describe("DebriefRecorder — awaits transcription finalization before submitting", () => {
  it("awaits transcription.stop() rather than treating it as synchronous", () => {
    const allCalls = SOURCE.match(/transcription\.stop\(\)/g) ?? [];
    const awaitedCalls = SOURCE.match(/await transcription\.stop\(\)/g) ?? [];
    expect(allCalls.length).toBeGreaterThan(0);
    expect(awaitedCalls.length).toBe(allCalls.length);
  });

  it("disables the Finish button before the finalize wait, not after", () => {
    const setAnalyzingIndex = SOURCE.indexOf('setPhase("analyzing")');
    const stopIndex = SOURCE.indexOf("await transcription.stop()");
    expect(setAnalyzingIndex).toBeGreaterThan(-1);
    expect(stopIndex).toBeGreaterThan(setAnalyzingIndex);
  });
});
