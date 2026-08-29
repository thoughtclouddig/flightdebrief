import { describe, expect, it } from "vitest";
import { audioCacheKey } from "./audio-cache";

describe("audioCacheKey", () => {
  it("changes when the script changes, so a fixed narration isn't served stale", () => {
    const before = audioCacheKey("next-lesson:flight-1", "aura", "Nina had me work on configuring earlier.");
    const after = audioCacheKey("next-lesson:flight-1", "aura", "Nina had you work on configuring earlier.");
    expect(before).not.toBe(after);
  });

  it("is stable for the same script, so nothing is re-synthesized needlessly", () => {
    const script = "Hey Carlos, quick brief before you fly.";
    expect(audioCacheKey("next-lesson:flight-1", "aura", script)).toBe(
      audioCacheKey("next-lesson:flight-1", "aura", script),
    );
  });

  it("separates voices", () => {
    const script = "Hey Carlos, quick brief before you fly.";
    expect(audioCacheKey("next-lesson:flight-1", "aura", script)).not.toBe(
      audioCacheKey("next-lesson:flight-1", "orion", script),
    );
  });

  it("separates subjects, so two flights with identical scripts don't collide", () => {
    const script = "Hey Carlos, quick brief before you fly.";
    expect(audioCacheKey("next-lesson:flight-1", "aura", script)).not.toBe(
      audioCacheKey("next-lesson:flight-2", "aura", script),
    );
  });
});
