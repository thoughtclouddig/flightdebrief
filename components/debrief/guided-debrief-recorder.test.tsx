import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Same untestable-without-real-browser-APIs situation as DebriefRecorder --
 * see components/debrief-recorder.test.tsx and lib/transcription/use-
 * deepgram-transcription.test.ts for why this is a static-source proof.
 */
const SOURCE = readFileSync(new URL("./guided-debrief-recorder.tsx", import.meta.url), "utf8");

describe("GuidedDebriefRecorder — awaits transcription finalization before submitting", () => {
  it("awaits transcription.stop() rather than treating it as synchronous", () => {
    const allCalls = SOURCE.match(/transcription\.stop\(\)/g) ?? [];
    const awaitedCalls = SOURCE.match(/await transcription\.stop\(\)/g) ?? [];
    expect(allCalls.length).toBeGreaterThan(0);
    expect(awaitedCalls.length).toBe(allCalls.length);
  });

  it("captures recordingEndedAt before the finalize wait, not after -- otherwise the wait itself would pad the timestamp", () => {
    const endedAtIndex = SOURCE.indexOf("const recordingEndedAt = new Date().toISOString()");
    const stopIndex = SOURCE.indexOf("await transcription.stop()");
    expect(endedAtIndex).toBeGreaterThan(-1);
    expect(endedAtIndex).toBeLessThan(stopIndex);
  });
});
