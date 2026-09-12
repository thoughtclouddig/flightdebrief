import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VectorTrainingSession } from "./vector-training-session";
import { curatedTrainingGuidance } from "@/lib/topics";
import type { VectorStrategy } from "@/lib/student/vector-coaching";

// Static-markup rendering only (this codebase's test convention for client
// components) -- Radio Practice's launch action needs router.push after an
// async assign call, so useRouter needs a real app-router context stubbed.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

const HREFS = { chairFlyHref: "/train/chair-fly", radioPracticeHref: "/train/radio-practice" };
const EVIDENCE = { label: "Danny · Aug 20", text: "Lost thirty feet in the turn." };

function render(strategy: VectorStrategy, overrides: Partial<Parameters<typeof VectorTrainingSession>[0]> = {}) {
  return renderToStaticMarkup(
    <VectorTrainingSession
      skillLabel="Crosswind landings"
      isPhysicalSkill
      evidence={EVIDENCE}
      strategy={strategy}
      itemId="item-1"
      radioScenarioId={null}
      pendingRadioPracticeAssignmentId={null}
      hrefs={HREFS}
      evaluateHref="/api/train/vector/item-1/evaluate"
      {...overrides}
    />,
  ).replace(/&#x27;/g, "'").replace(/&rsquo;/g, "’");
}

describe("VectorTrainingSession — one bounded interaction, never a growing chat, never a dead end", () => {
  it("renders Chair Fly with a real link, non-scored, no question, no textarea", () => {
    const markup = render({ kind: "chair-fly" });
    expect(markup).toContain('href="/train/chair-fly"');
    expect(markup).toContain("Rehearse with Vector");
    expect(markup).not.toContain("<textarea");
    // Never a score/correct-incorrect framing anywhere near it.
    expect(markup).not.toMatch(/correct|incorrect|score/i);
  });

  it("frames Radio Practice as rehearsal when mechanism is already known (mode: train)", () => {
    const markup = render({ kind: "radio-practice", mode: "train" });
    expect(markup).toContain("Let’s rehearse this on the radio");
    expect(markup).toContain("Start Radio Practice");
    expect(markup).not.toContain("<textarea");
  });

  it("frames Radio Practice as diagnostic when mechanism is unknown (mode: diagnose)", () => {
    const markup = render({ kind: "radio-practice", mode: "diagnose" });
    expect(markup).toContain("Let’s find out more");
    expect(markup).toContain("Start Radio Practice");
  });

  it("offers to resume an already-linked, incomplete Radio Practice attempt instead of implying a fresh one", () => {
    const markup = render({ kind: "radio-practice", mode: "diagnose" }, { pendingRadioPracticeAssignmentId: "assignment-pending" });
    expect(markup).toContain("Continue Radio Practice");
    expect(markup).not.toContain("Start Radio Practice");
  });

  it("renders direct coaching from a known mechanism, no quiz, no rehearsal hand-off", () => {
    const markup = render({ kind: "coach", message: "You're still relaxing the correction once you get into the flare. Aileron holds the wing into the wind." });
    expect(markup).toContain("You're still relaxing the correction once you get into the flare.");
    expect(markup).not.toContain("<textarea");
    expect(markup).not.toContain("Rehearse with Vector");
    expect(markup).toContain("Done");
  });

  it("renders the honest flight-transfer objective, never a manufactured quiz, never a dead end", () => {
    const markup = render({ kind: "transfer", objective: "This came up in your debrief, but the next useful step is in the airplane. On your next flight, ask Danny to watch specifically for: the fuel sump check." });
    expect(markup).toContain("Take this into your next flight");
    expect(markup).toContain("the fuel sump check");
    expect(markup).not.toContain("<textarea");
    expect(markup).not.toContain("Nothing prepared for this yet");
  });

  it("presents the one reviewed diagnostic question and nothing else before an answer is submitted -- bounded, not an open chat", () => {
    const guidance = curatedTrainingGuidance("STEEP_TURNS")!;
    const markup = render({ kind: "check", question: { prompt: guidance.checkQuestion!.prompt } });
    expect(markup).toContain(guidance.checkQuestion!.prompt);
    expect(markup).toContain("<textarea");
    expect(markup).toContain("Get feedback");
    // Nothing from a not-yet-submitted evaluation appears -- there is no
    // second exchange, no transcript, no premature feedback, no premature
    // rehearsal hand-off or "no more ground training needed" objective.
    expect(markup).not.toContain("Take this into your next flight");
    expect(markup).not.toContain("Rehearse with Vector");
  });

  it("keeps the student's real evidence structurally separate from Vector's own reviewed question", () => {
    const guidance = curatedTrainingGuidance("STEEP_TURNS")!;
    const markup = render({ kind: "check", question: { prompt: guidance.checkQuestion!.prompt } });
    expect(markup).toContain("Lost thirty feet in the turn.");
    expect(markup).toContain("Danny · Aug 20");
    const evidenceIndex = markup.indexOf("Lost thirty feet in the turn.");
    const questionIndex = markup.indexOf(guidance.checkQuestion!.prompt);
    expect(evidenceIndex).toBeGreaterThan(-1);
    expect(questionIndex).toBeGreaterThan(evidenceIndex);
  });

  it("never renders the old capability-router dead-end copy anywhere in the component source", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("./vector-training-session.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/Nothing prepared for this yet/);
  });
});
