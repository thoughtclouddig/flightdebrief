import { describe, expect, it } from "vitest";
import { buildTranscriptSegments, type CardBoundary } from "./segments";
import type { TranscriptWord } from "@/lib/transcription/types";

function word(word: string, start: number, end: number, speaker: number | null = null): TranscriptWord {
  return { word, start, end, speaker };
}

describe("buildTranscriptSegments", () => {
  it("returns nothing for an empty transcript", () => {
    expect(buildTranscriptSegments([], [{ cardId: "c1", startSeconds: 0, endSeconds: 10 }])).toEqual([]);
  });

  it("assigns each word to the card whose window it falls in", () => {
    const words = [word("crosswind", 0, 1), word("landings", 1, 2), word("went", 10, 11), word("well", 11, 12)];
    const boundaries: CardBoundary[] = [
      { cardId: "card-crosswind", startSeconds: 0, endSeconds: 5 },
      { cardId: "card-risk", startSeconds: 5, endSeconds: 20 },
    ];
    const segments = buildTranscriptSegments(words, boundaries);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ debriefCardId: "card-crosswind", text: "crosswind landings", startSeconds: 0, endSeconds: 2 });
    expect(segments[1]).toMatchObject({ debriefCardId: "card-risk", text: "went well", startSeconds: 10, endSeconds: 12 });
  });

  it("extends an open-ended boundary (endSeconds null) to the last word", () => {
    const words = [word("still", 0, 1), word("talking", 30, 31)];
    const boundaries: CardBoundary[] = [{ cardId: "card-next-flight", startSeconds: 0, endSeconds: null }];
    const segments = buildTranscriptSegments(words, boundaries);
    expect(segments).toHaveLength(1);
    expect(segments[0].text).toBe("still talking");
    expect(segments[0].endSeconds).toBe(31);
  });

  it("keeps words outside every window as a debriefCardId: null segment instead of dropping them", () => {
    const words = [word("before", 0, 1), word("anything", 1, 2), word("started", 2, 3)];
    const boundaries: CardBoundary[] = [{ cardId: "card-objective", startSeconds: 10, endSeconds: 20 }];
    const segments = buildTranscriptSegments(words, boundaries);
    expect(segments).toHaveLength(1);
    expect(segments[0].debriefCardId).toBeNull();
    expect(segments[0].text).toBe("before anything started");
  });

  it("labels a segment with the majority diarized speaker", () => {
    const words = [word("I", 0, 1, 1), word("floated", 1, 2, 1), word("okay", 2, 3, 0)];
    const boundaries: CardBoundary[] = [{ cardId: "card-1", startSeconds: 0, endSeconds: 5 }];
    const segments = buildTranscriptSegments(words, boundaries);
    expect(segments[0].speakerLabel).toBe("Speaker 1");
  });

  it("returns segments sorted by start time regardless of boundary input order", () => {
    const words = [word("first", 0, 1), word("second", 10, 11)];
    const boundaries: CardBoundary[] = [
      { cardId: "card-b", startSeconds: 10, endSeconds: 20 },
      { cardId: "card-a", startSeconds: 0, endSeconds: 10 },
    ];
    const segments = buildTranscriptSegments(words, boundaries);
    expect(segments.map((s) => s.debriefCardId)).toEqual(["card-a", "card-b"]);
  });
});
