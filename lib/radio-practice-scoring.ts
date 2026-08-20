import type { RadioScenario } from "@/lib/radio-practice-scenarios";

export interface RadioElementScore {
  description: string;
  matched: boolean;
}

export interface RadioScenarioScore {
  elements: RadioElementScore[];
  /** True when every required element matched -- or when the scenario has no spoken readback to score (see RadioScenario.scoringPhrases). */
  correct: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** All whitespace removed -- a fallback comparison for when live transcription drops the space between two words at a chunk boundary (e.g. "clearedfor takeoff"), which would otherwise fail an exact substring match despite every word being correct. */
function collapse(text: string): string {
  return normalize(text).replace(/\s+/g, "");
}

/**
 * Deterministic, keyword-based scoring -- not an AI judgment call. A real
 * ATC readback either contains the required elements or it doesn't (AIM
 * 4-4-10, Adherence to Clearance), so this checks the transcript against
 * each element's acceptable phrasing alternatives (see
 * RadioScenario.scoringPhrases) rather than asking a model to grade it.
 * An element with no listed alternatives (or a scenario with none at all --
 * a visual-signal recognition scenario, not a spoken readback) is treated
 * as automatically satisfied.
 */
export function scoreRadioTranscript(scenario: RadioScenario, transcript: string): RadioScenarioScore {
  const normalizedTranscript = normalize(transcript);

  const collapsedTranscript = collapse(transcript);

  const elements: RadioElementScore[] = scenario.requiredElements.map((description, i) => {
    const alternatives = scenario.scoringPhrases[i] ?? [];
    const matched =
      alternatives.length === 0 ||
      alternatives.some(
        (alt) => normalizedTranscript.includes(normalize(alt)) || collapsedTranscript.includes(collapse(alt)),
      );
    return { description, matched };
  });

  return { elements, correct: elements.every((e) => e.matched) };
}
