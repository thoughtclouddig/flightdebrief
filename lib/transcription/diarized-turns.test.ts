import { describe, expect, it } from "vitest";
import { buildDiarizedTurns } from "./diarized-turns";
import type { TranscriptWord } from "./types";

function words(spec: [string, number | null][]): TranscriptWord[] {
  return spec.map(([word, speaker], i) => ({ word, start: i, end: i + 1, speaker }));
}

describe("buildDiarizedTurns", () => {
  it("groups consecutive words by speaker into labeled turns", () => {
    const result = buildDiarizedTurns(
      words([
        ["you", 0],
        ["were", 0],
        ["high", 0],
        ["yeah", 1],
        ["I", 1],
        ["noticed", 1],
      ]),
    );
    expect(result).toBe("Speaker 1: you were high\nSpeaker 2: yeah I noticed");
  });

  it("starts a new turn each time the speaker changes back", () => {
    const result = buildDiarizedTurns(
      words([
        ["okay", 0],
        ["right", 1],
        ["good", 0],
      ]),
    );
    expect(result).toBe("Speaker 1: okay\nSpeaker 2: right\nSpeaker 1: good");
  });

  it("returns null for a single speaker -- labels would add nothing over the flat transcript", () => {
    expect(buildDiarizedTurns(words([["just", 0], ["me", 0]]))).toBeNull();
  });

  it("returns null when no word carries diarization data", () => {
    expect(buildDiarizedTurns(words([["a", null], ["b", null]]))).toBeNull();
  });

  it("labels untagged words as Unknown rather than silently dropping them", () => {
    const result = buildDiarizedTurns(
      words([
        ["hi", 0],
        ["mumble", null],
        ["there", 1],
      ]),
    );
    expect(result).toBe("Speaker 1: hi\nUnknown: mumble\nSpeaker 2: there");
  });

  it("handles an empty word list", () => {
    expect(buildDiarizedTurns([])).toBeNull();
  });
});
