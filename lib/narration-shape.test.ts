import { describe, expect, it } from "vitest";
import { readsAsSentence, speakItems } from "./narration";

describe("readsAsSentence", () => {
  it("recognises a sentence, however short", () => {
    expect(readsAsSentence("Nina had you work on configuring earlier")).toBe(true);
    expect(readsAsSentence("Your radio calls were rushed")).toBe(true);
  });

  it("recognises a noun phrase, however long", () => {
    expect(readsAsSentence("getting configured earlier on downwind")).toBe(false);
    expect(readsAsSentence("airspeed control on final")).toBe(false);
    expect(readsAsSentence("flare timing")).toBe(false);
  });
});

describe("speakItems", () => {
  const frame = (list: string) => `Keep an eye on ${list} -- you're already making progress there.`;

  it("puts phrases inside the frame", () => {
    expect(speakItems(["flare timing", "airspeed control"], frame, "Also carrying over:")).toBe(
      "Keep an eye on flare timing and airspeed control -- you're already making progress there.",
    );
  });

  it("speaks a sentence on its own rather than inside the frame", () => {
    // The exact failure: "Keep an eye on Nina had you work on..." is not English.
    const spoken = speakItems(
      ["Nina had you work on getting configured earlier on downwind"],
      frame,
      "Also carrying over:",
    );
    expect(spoken).toBe("Also carrying over: Nina had you work on getting configured earlier on downwind.");
    expect(spoken).not.toContain("Keep an eye on Nina had");
  });

  it("handles a mix, keeping each in the right shape", () => {
    const spoken = speakItems(
      ["flare timing", "Nina had you work on configuring earlier"],
      frame,
      "Also carrying over:",
    );
    expect(spoken).toBe(
      "Keep an eye on flare timing -- you're already making progress there. Also carrying over: Nina had you work on configuring earlier.",
    );
  });

  it("returns nothing for an empty list", () => {
    expect(speakItems([], frame, "Also carrying over:")).toBe("");
  });
});
