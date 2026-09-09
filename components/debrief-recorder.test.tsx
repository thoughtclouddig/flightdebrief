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

describe("DebriefRecorder — Flight Objectives", () => {
  it("no longer renders the old solo/instructor instruction copy", () => {
    expect(SOURCE).not.toMatch(/the way you'd replay it in your head/);
    expect(SOURCE).not.toMatch(/like you would with your instructor/);
  });

  it("renders the approved instruction copy, adapted only for whether there are objectives to reference", () => {
    expect(SOURCE).toContain(
      "Talk through the flight in your own words. What went well? What needs work? Use your flight objectives below if you need a reminder.",
    );
    expect(SOURCE).toContain("Talk through the flight in your own words. What went well? What needs work?");
  });

  it("renders the Flight Objectives panel as a plain reminder, never a checklist", () => {
    expect(SOURCE).toMatch(/Flight Objectives/);
    expect(SOURCE).toMatch(/Use these as a reminder\./);
    expect(SOURCE).toMatch(/need to cover them in order\./);
    expect(SOURCE).not.toMatch(/type=["']checkbox["']/);
    expect(SOURCE).not.toMatch(/localStatus/);
  });

  it("omits the panel entirely when there are no flight_tasks, rather than rendering an empty section", () => {
    const fnIndex = SOURCE.indexOf("function FlightObjectives(");
    const bodyEnd = SOURCE.indexOf("\n}", fnIndex);
    const body = SOURCE.slice(fnIndex, bodyEnd);
    expect(body).toMatch(/if \(taskLabels\.length === 0\) return null;/);
  });

  it("renders the panel in both the ready and recording phases, not only one", () => {
    const occurrences = SOURCE.match(/<FlightObjectives taskLabels={taskLabels} \/>/g) ?? [];
    expect(occurrences.length).toBe(2);
  });

  it("passes taskLabels through as a prop with a safe default, not a required prop", () => {
    expect(SOURCE).toMatch(/taskLabels\s*=\s*\[\]/);
  });
});
