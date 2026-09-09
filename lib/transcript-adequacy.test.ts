import { describe, expect, it } from "vitest";
import { assessTranscriptAdequacy } from "./transcript-adequacy";

describe("assessTranscriptAdequacy", () => {
  it("rejects an empty transcript", () => {
    expect(assessTranscriptAdequacy("")).toEqual({ adequate: false, reason: "empty" });
  });

  it("rejects a whitespace-only transcript", () => {
    expect(assessTranscriptAdequacy("   \n\t  ")).toEqual({ adequate: false, reason: "empty" });
  });

  it('rejects "This is a test. This is a test." -- the real Staging junk transcript', () => {
    const result = assessTranscriptAdequacy("This is a test. This is a test.");
    expect(result.adequate).toBe(false);
    expect(result.reason).toBe("too_short");
  });

  it("rejects short repeated filler", () => {
    const result = assessTranscriptAdequacy("um um um uh uh okay okay");
    expect(result.adequate).toBe(false);
  });

  it("rejects a single word", () => {
    expect(assessTranscriptAdequacy("hello")).toEqual({ adequate: false, reason: "too_short" });
  });

  it("rejects longer repetition that clears the raw word-count floor but has almost no distinct content", () => {
    // 16 words, but only 4 distinct -- past MIN_TOTAL_WORDS on raw count alone.
    const result = assessTranscriptAdequacy("This is a test. This is a test. This is a test. This is a test.");
    expect(result.adequate).toBe(false);
    expect(result.reason).toBe("too_repetitive");
  });

  it("accepts a concise but substantive debrief", () => {
    const result = assessTranscriptAdequacy(
      "Landings were solid today, we worked on crosswind correction on final, and my radio calls were a little rushed but I caught myself each time.",
    );
    expect(result).toEqual({ adequate: true, reason: null });
  });

  it("accepts a normal, longer substantive debrief", () => {
    const result = assessTranscriptAdequacy(
      "We started with a preflight walkaround and I briefed the weather before we took off from the pattern. " +
        "Climb-out was smooth, and we headed out to the practice area for slow flight and stalls, which went well. " +
        "Back in the pattern, my first landing floated a bit long, so we went around and tried again. " +
        "The second approach was much more stable and the touchdown was soft. " +
        "Next time I want to focus on holding a steadier approach speed on final.",
    );
    expect(result).toEqual({ adequate: true, reason: null });
  });

  it("strips pure verbal disfluencies before counting, without penalizing real content", () => {
    const withFiller = assessTranscriptAdequacy(
      "Um, so, landings were solid today, uh, we worked on crosswind correction on final, and my radio calls were, um, a little rushed but I caught myself each time.",
    );
    expect(withFiller.adequate).toBe(true);
  });

  it("accepts a real ~15-second debrief -- the short end of what a genuine recording sounds like", () => {
    // ~33 words at natural speaking pace, roughly a 15-second recording.
    // This is the length most at risk of a false rejection if the recorder
    // drops even a sentence off the end -- see use-deepgram-transcription.ts.
    const result = assessTranscriptAdequacy(
      "Pattern work went okay today. First landing was a little long but the second one felt better. Radio calls were fine. I want to work on holding my airspeed on final next time.",
    );
    expect(result).toEqual({ adequate: true, reason: null });
  });

  it("accepts a real ~25-second debrief with natural pauses and restarts", () => {
    // ~65 words, roughly 25 seconds -- the middle of the range a normal
    // debrief actually falls in.
    const result = assessTranscriptAdequacy(
      "So today we went out and worked slow flight and power-off stalls, and honestly the stall recovery felt a lot better than last time. " +
        "Coming back into the pattern my first landing floated a little long, I was carrying too much speed, but the second one was much smoother. " +
        "Radio calls were mostly fine, I just missed one call entering the downwind.",
    );
    expect(result).toEqual({ adequate: true, reason: null });
  });

  it("accepts filler-heavy but genuinely meaningful speech -- disfluencies never push real content below the floor", () => {
    const result = assessTranscriptAdequacy(
      "Um, so, today was, um, pretty good I think. We went out and did, uh, some stalls and slow flight, and honestly it went " +
        "better than last time. The landing was, um, a little rough but I caught it okay, and radio calls were, uh, mostly on point.",
    );
    expect(result.adequate).toBe(true);
  });
});
