import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { splitForTts } from "./tts-chunks";
import { synthesizeSpeech } from "./deepgram-tts";
import { buildDebriefNarration } from "./debrief-narration";

/**
 * Hits the REAL Deepgram API. Skipped unless DEEPGRAM_API_KEY is set, so it
 * never runs in a normal `npm test` -- run it on Replit, where the key lives:
 *
 *   npx vitest run lib/deepgram-tts.integration
 *
 * This exists because the unit tests in tts-chunks.test.ts prove the splitting
 * is correct but prove nothing about the two things that can only fail against
 * the real service: whether a chunk under our limit is actually accepted, and
 * whether concatenated MP3 buffers play as one continuous file. The second one
 * needs a human ear -- the test writes the audio to ./tts-check.mp3 so you can
 * play it and listen for a click, a gap, or a dropped word at the seams.
 */
const KEY = process.env.DEEPGRAM_API_KEY;

describe.skipIf(!KEY)("Deepgram TTS against the live API", () => {
  it("sends a realistic narrativeRecap debrief as a single request", async () => {
    // A recap the prompt would actually produce -- it caps this at 120-220
    // words, which is why debrief length barely moves the script length.
    const recap = (
      "Early on you were chasing the airspeed a little on downwind, and Danny had you set the power " +
      "and let the airplane settle before you touched anything else. That made a real difference by " +
      "the third circuit. Where it got interesting was the short field work -- you were holding the " +
      "brakes and getting full power in, but rotating a touch early, so the airplane came off before " +
      "it was ready to fly. Danny walked you through waiting for the number and then letting it climb " +
      "at Vx. By the end you were flying the numbers instead of reacting to them, and the last two " +
      "landings were noticeably more settled than the first."
    ).trim();

    const script = buildDebriefNarration({
      studentFirstName: "Danny",
      instructorFirstName: "Maria",
      narrativeRecap: recap,
      whatWeDid: [],
      wentWell: [],
      needsWork: [],
      instructorGuidance: [],
      actionItems: [],
      studyReferences: [],
    });

    const chunks = splitForTts(script);
    console.log(`[recap path] ${script.length} chars -> ${chunks.length} request(s)`);
    expect(chunks).toHaveLength(1);

    const audio = await synthesizeSpeech(script, KEY!, null);
    expect(audio.byteLength).toBeGreaterThan(10_000);
  }, 120_000);

  it("synthesizes a script well past the 2000-char limit and joins it", async () => {
    // The templated fallback branch: no word budget, grows with how many
    // action items and references the debrief produced. This is the shape
    // that was returning 413.
    const script = buildDebriefNarration({
      studentFirstName: "Danny",
      instructorFirstName: "Maria",
      whatWeDid: ["Normal takeoffs", "Short field takeoffs", "Soft field takeoffs", "Go-arounds", "Radio communications"],
      wentWell: Array.from({ length: 6 }, (_, i) => `Held the centerline through the rollout on circuit ${i + 1}`),
      needsWork: Array.from({ length: 6 }, (_, i) => `Round-out timing on the flare, attempt ${i + 1}, still ballooning slightly`),
      instructorGuidance: Array.from({ length: 5 }, (_, i) => ({
        instructorName: "Maria",
        quote: `Keep that nose on the horizon as we turn, and let the airplane settle before you add anything, call ${i + 1}`,
      })),
      actionItems: Array.from({ length: 8 }, (_, i) => `Practice holding target approach speed through short final, item ${i + 1}`),
      studyReferences: Array.from({ length: 5 }, (_, i) => ({
        topic: `Takeoffs and landings, part ${i + 1}`,
        source: "Airplane Flying Handbook Chapter 9",
        url: "https://www.faa.gov/training_testing/testing/acs",
        why: "Covers the round-out and flare sequence.",
      })),
    });

    const chunks = splitForTts(script);
    console.log(
      `[template path] ${script.length} chars -> ${chunks.length} request(s), sizes: ${chunks.map((c) => c.length).join(", ")}`,
    );
    expect(script.length).toBeGreaterThan(2000);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(1800);

    // The whole point: this exact input used to 413.
    const audio = await synthesizeSpeech(script, KEY!, null);
    expect(audio.byteLength).toBeGreaterThan(50_000);

    writeFileSync("tts-check.mp3", audio);
    console.log(`[template path] wrote tts-check.mp3 (${(audio.byteLength / 1024).toFixed(0)} KB) -- play it and listen at the seams`);
  }, 300_000);
});
