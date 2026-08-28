import { describe, expect, it } from "vitest";
import { splitForTts } from "./tts-chunks";

describe("splitForTts", () => {
  it("leaves text under the limit as a single chunk", () => {
    expect(splitForTts("Nice work on the landings today.", 100)).toEqual(["Nice work on the landings today."]);
  });

  it("returns nothing for empty or whitespace-only input", () => {
    // The API 400s on empty input, so a caller must never send one.
    expect(splitForTts("")).toEqual([]);
    expect(splitForTts("   \n  ")).toEqual([]);
  });

  it("splits on sentence boundaries and keeps the terminator", () => {
    // Each sentence fits, so the break lands on the period rather than
    // mid-clause -- a seam at a full stop is inaudible, one mid-sentence isn't.
    const chunks = splitForTts("Full power. Hold brakes. Rotate at sixty.", 22);
    expect(chunks).toEqual(["Full power.", "Hold brakes.", "Rotate at sixty."]);
  });

  it("keeps every chunk within the limit", () => {
    const sentence = "Danny walked through the short field takeoff again. ";
    const chunks = splitForTts(sentence.repeat(80), 1800);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(1800);
  });

  it("preserves every word, in order, across the split", () => {
    const text = "Airspeed on final. Flaps as required. Aim point steady. Flare and hold it off.";
    const words = (s: string) => s.split(/\s+/).filter(Boolean);
    expect(words(splitForTts(text, 20).join(" "))).toEqual(words(text));
  });

  it("falls back to word boundaries for a sentence longer than the limit", () => {
    const runOn = "we did the thing and then the other thing and then another thing entirely";
    const chunks = splitForTts(runOn, 20);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
      expect(chunk).not.toMatch(/^\s|\s$/);
    }
    expect(chunks.join(" ")).toBe(runOn);
  });

  it("hard-cuts a single word that exceeds the limit rather than emitting an over-limit chunk", () => {
    const chunks = splitForTts("x".repeat(45), 20);
    expect(chunks).toEqual(["x".repeat(20), "x".repeat(20), "x".repeat(5)]);
  });

  it("never emits an empty chunk", () => {
    const chunks = splitForTts("One.    Two.     Three.", 10);
    expect(chunks.every((c) => c.trim().length > 0)).toBe(true);
  });
});
