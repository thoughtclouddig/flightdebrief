import { describe, expect, it } from "vitest";
import { mergeFinalAndInterim } from "./merge-transcript";

describe("mergeFinalAndInterim", () => {
  it("returns the final text unchanged when there's no leftover interim", () => {
    expect(mergeFinalAndInterim("We worked the pattern today.", "")).toBe("We worked the pattern today.");
  });

  it("returns the interim text when nothing was ever finalized", () => {
    expect(mergeFinalAndInterim("", "We worked the pattern today.")).toBe("We worked the pattern today.");
  });

  it("appends leftover interim that doesn't overlap the finalized text", () => {
    expect(mergeFinalAndInterim("We worked the pattern today.", "Landings were a little rough.")).toBe(
      "We worked the pattern today. Landings were a little rough.",
    );
  });

  it("drops a repeated tail instead of duplicating it (mixed final + overlapping interim)", () => {
    const final = "My first landing was pretty rough";
    // Deepgram's interim re-states the last two words of the final segment
    // before continuing with genuinely new content.
    const interim = "pretty rough and I floated a bit";
    expect(mergeFinalAndInterim(final, interim)).toBe("My first landing was pretty rough and I floated a bit");
  });

  it("is case- and punctuation-insensitive when detecting a whole-word overlap", () => {
    const final = "We practiced a go-around.";
    const interim = "go-around, and then came back for another landing.";
    expect(mergeFinalAndInterim(final, interim)).toBe("We practiced a go-around. and then came back for another landing.");
  });

  it("drops even a single-word coincidental overlap at the seam, so the word isn't duplicated", () => {
    // "the" ends the final segment and starts the interim tail -- comparison
    // is word-for-word, so this drops the repeated word rather than leaving
    // "the the" in the merged transcript.
    const final = "We climbed out over the";
    const interim = "the tower called our base turn early";
    expect(mergeFinalAndInterim(final, interim)).toBe("We climbed out over the tower called our base turn early");
  });

  it("handles a full-sentence duplicate (entire interim already finalized)", () => {
    const final = "We started with some pattern work.";
    const interim = "some pattern work.";
    expect(mergeFinalAndInterim(final, interim)).toBe("We started with some pattern work.");
  });

  it("returns empty string when both inputs are empty", () => {
    expect(mergeFinalAndInterim("", "")).toBe("");
  });

  it("models a long, low-pause debrief: a large trailing interim block never promoted to final survives", () => {
    const final = "We started with some pattern work. My first landing was pretty rough.";
    const longInterimTail =
      "I was carrying too much speed and floated the next two were better we also practiced a go around radio calls were much better today but I missed one instruction from tower and had to ask for a repeat";
    const merged = mergeFinalAndInterim(final, longInterimTail);
    expect(merged.split(/\s+/).length).toBeGreaterThan(30);
    expect(merged).toContain("radio calls were much better today");
  });
});
