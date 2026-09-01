import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";
import type { RadioScenario } from "@/lib/radio-practice-scenarios";
import type { RadioScenarioScore } from "@/lib/radio-practice-scoring";

/**
 * Judges a radio readback the way an instructor would, instead of matching
 * strings.
 *
 * Keyword scoring marks a correct transmission wrong whenever the student
 * phrases it differently: "three alpha bravo, taxi two seven via alpha, hold
 * short one eight" contains every required element and fails a substring
 * check written around a different word order. A student told they were wrong
 * when they were right learns the wrong lesson, and stops trusting the tool.
 *
 * The judge is deliberately not free-running. Everything it grades against
 * comes from the scenario -- the required elements, the model readback, and
 * the AIM paragraph already cited on it. It is not asked what correct
 * phraseology is, only whether this transmission contains what the scenario
 * says it must. That boundary matters more here than in most places: a model
 * that invents plausible phraseology teaches a student something they will
 * repeat to a real controller.
 */

const MODEL = "claude-sonnet-5";
/** Short: a student is waiting, and keyword scoring is a usable fallback. */
const REQUEST_TIMEOUT_MS = 20_000;

export interface RadioJudgement extends RadioScenarioScore {
  /** One or two sentences a CFI might say. Null when there's nothing to add. */
  coaching: string | null;
  /**
   * Set when the judge believes the scenario itself is wrong -- an element
   * that isn't actually required, a model readback that doesn't match the
   * setup. Surfaced to staff, never to the student.
   *
   * This exists because exactly that bug shipped: a scenario asked a student
   * to read the altimeter back to Ground, which nobody does. The bank is
   * hand-written and nothing was checking it.
   */
  scenarioConcern: string | null;
}

const judgementSchema = z.object({
  elements: z
    .array(z.object({ description: z.string().default(""), matched: z.boolean().default(false) }))
    .default([]),
  coaching: z.string().nullable().default(null),
  scenarioConcern: z.string().nullable().default(null),
});

const SYSTEM = `You are a flight instructor grading one radio transmission from a student pilot.

You are given the scenario, what the controller said, the elements the scenario requires, a model readback, and the AIM paragraph the scenario is grounded in.

HOW TO JUDGE

Mark an element matched when the student conveyed it, in any correct phrasing. Radio work has real variation: "three alpha bravo" and "Cessna three Alpha Bravo" are the same callsign; "taxi two seven via alpha" and "taxi to Runway two seven via Alpha" are the same readback. Word order is not a requirement.

Mark it unmatched when the student omitted it, said it wrong, or said a different value than the controller gave. Numbers must match exactly -- "hold short of one eight" when the controller said one six is a real error, and the single most important thing on this page.

Do not invent requirements. Grade only the elements listed. If the student's transmission is perfect but the scenario asks for something they had no reason to say, that is the scenario's fault, not theirs: mark the element matched and describe the problem in scenarioConcern.

COACHING

At most two sentences, in an instructor's voice, only when there is something worth saying. Name what to fix, not what went well. Null when the readback was clean.

Return ONLY this JSON, no fences, no commentary:

{
  "elements": [{ "description": "the element, copied exactly as given", "matched": true }],
  "coaching": "one or two sentences, or null",
  "scenarioConcern": "what looks wrong with the scenario itself, or null"
}

Return one element per required element, in the same order.`;

export async function judgeRadioTranscript(
  scenario: RadioScenario,
  transcript: string,
): Promise<RadioJudgement | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // No key, or nothing said: the caller falls back to keyword scoring.
  if (!apiKey || !transcript.trim()) return null;

  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Scenario: ${scenario.title}
Setup: ${scenario.setup}

What the controller said:
"${scenario.atcCall}"

Required elements:
${scenario.requiredElements.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Model readback:
"${scenario.modelReadback}"

Grounded in: ${scenario.source}

What the student said:
"${transcript}"`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const parsed = judgementSchema.parse(JSON.parse(extractJson(textBlock.text)));

  // A judgment that doesn't cover every element isn't a judgment. Falling
  // back to keyword scoring beats reporting a partial one as complete.
  if (parsed.elements.length !== scenario.requiredElements.length) return null;

  const elements = scenario.requiredElements.map((description, i) => ({
    description,
    matched: parsed.elements[i]?.matched ?? false,
  }));

  return {
    elements,
    correct: elements.every((e) => e.matched),
    coaching: parsed.coaching?.trim() || null,
    scenarioConcern: parsed.scenarioConcern?.trim() || null,
  };
}
