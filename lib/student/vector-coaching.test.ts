import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVectorSession, rehearsalEngineFor, resolveVectorStrategy } from "./vector-coaching";

describe("buildVectorSession — every card's one button, always a real link", () => {
  it("links to /train/vector/<itemId>", () => {
    expect(buildVectorSession("item-123")).toEqual({ buttonLabel: "Train with Vector", href: "/train/vector/item-123" });
  });

  it("always returns the same literal button label", () => {
    expect(buildVectorSession("a").buttonLabel).toBe("Train with Vector");
    expect(buildVectorSession("b").buttonLabel).toBe("Train with Vector");
  });
});

describe("rehearsalEngineFor — real capability availability, independent of diagnosis", () => {
  it("finds the real Chair Fly engine whenever the skill itself has an authored scenario", () => {
    expect(rehearsalEngineFor("CROSSWIND_LANDING")).toEqual({ kind: "chair-fly" });
  });

  it("finds the real Radio Practice engine for radio communications", () => {
    expect(rehearsalEngineFor("RADIO_COMMUNICATIONS")).toEqual({ kind: "radio-practice" });
  });

  it("finds Radio Practice for tower communications -- a real scenario covers it, a bare 'RADIO_COMMUNICATIONS' literal check would have missed this", () => {
    expect(rehearsalEngineFor("TOWER_READBACKS")).toEqual({ kind: "radio-practice" });
  });

  it("never finds a physical/procedural skill's Radio Practice-tagged scenario as a Radio Practice engine -- category must be COMMUNICATIONS too", () => {
    // GO_AROUND has a real Radio Practice scenario tagged against it, but its
    // own TOPIC_LIBRARY category is LANDINGS, not COMMUNICATIONS -- a "keep
    // working on" item about a go-around is almost always about the flying,
    // not the radio call inside it.
    expect(rehearsalEngineFor("GO_AROUND")).not.toEqual({ kind: "radio-practice" });
  });

  it("never claims Radio Practice for a COMMUNICATIONS-category skill the scenario bank has no real scenario for", () => {
    // ATC_LIGHT_SIGNALS is a real COMMUNICATIONS-category skill with no
    // authored Radio Practice scenario -- claiming an engine that doesn't
    // exist would be its own false "Train with Vector" dead end.
    expect(rehearsalEngineFor("ATC_LIGHT_SIGNALS")).toBeNull();
  });

  it("returns null for a skill with no authored engine at all", () => {
    expect(rehearsalEngineFor("STEEP_TURNS")).toBeNull();
  });

  it("returns null for the honest 'general' fallback (no resolved skill)", () => {
    expect(rehearsalEngineFor("general")).toBeNull();
  });
});

describe("resolveVectorStrategy — the one appropriate next move, decided after diagnosis, never before", () => {
  it("offers one retry when the diagnostic answer reveals a real gap and retry material exists and none has been spent yet", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      diagnosis: { matchedConceptCount: 0, expectedConceptCount: 3 },
      retried: false,
      commonErrors: ["Losing altitude as bank steepens, from not adding enough back-pressure."],
      objective: "Add back-pressure as bank increases.",
    });
    expect(result).toEqual({ kind: "retry", hint: "Losing altitude as bank steepens, from not adding enough back-pressure." });
  });

  it("never offers a second retry -- a skill already retried goes straight to a real next move even with a weak answer", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      diagnosis: { matchedConceptCount: 0, expectedConceptCount: 3 },
      retried: true,
      commonErrors: ["Losing altitude as bank steepens, from not adding enough back-pressure."],
      objective: "Add back-pressure as bank increases.",
    });
    expect(result.kind).not.toBe("retry");
    expect(result.kind).toBe("done");
  });

  it("never retries when there's no curated commonErrors material to frame a second round with", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      diagnosis: { matchedConceptCount: 0, expectedConceptCount: 3 },
      retried: false,
      commonErrors: [],
      objective: "Add back-pressure as bank increases.",
    });
    expect(result.kind).not.toBe("retry");
  });

  it("hands off to the real rehearsal engine once diagnosis is done, even when the answer was strong -- physical execution is fixed by rehearsing it, not more Q&A", () => {
    const result = resolveVectorStrategy({
      skill: "CROSSWIND_LANDING",
      diagnosis: { matchedConceptCount: 3, expectedConceptCount: 3 },
      retried: false,
      commonErrors: ["Late correction on short final."],
      objective: "Carry the correction through the flare.",
    });
    expect(result).toEqual({ kind: "chair-fly" });
  });

  it("hands off to Radio Practice the same way for a COMMUNICATIONS skill with a real scenario", () => {
    const result = resolveVectorStrategy({
      skill: "RADIO_COMMUNICATIONS",
      diagnosis: null,
      retried: false,
      commonErrors: [],
      objective: "Read back the full clearance.",
    });
    expect(result).toEqual({ kind: "radio-practice" });
  });

  it("returns done with the given objective -- the legitimate 'no more ground training needed' outcome -- when there's no rehearsal engine and no real gap left", () => {
    const result = resolveVectorStrategy({
      skill: "STEEP_TURNS",
      diagnosis: { matchedConceptCount: 3, expectedConceptCount: 3 },
      retried: false,
      commonErrors: ["Losing altitude as bank steepens, from not adding enough back-pressure."],
      objective: "Add back-pressure as bank increases.",
    });
    expect(result).toEqual({ kind: "done", objective: "Add back-pressure as bank increases." });
  });

  it("returns done, never invents a retry, for the honest 'general' fallback with no diagnosis at all", () => {
    const result = resolveVectorStrategy({ skill: "general", diagnosis: null, retried: false, commonErrors: [], objective: "" });
    expect(result).toEqual({ kind: "done", objective: "" });
  });
});

describe("vector-coaching.ts never calls an LLM", () => {
  it("has no import of any AI/model client -- routing decisions are pure and deterministic", () => {
    const source = readFileSync(new URL("./vector-coaching.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/anthropic|claude|openai|from ["']@\/lib\/ai/i);
  });
});
