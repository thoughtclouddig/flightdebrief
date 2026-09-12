import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VectorTrainingSession } from "./vector-training-session";
import { curatedTrainingGuidance } from "@/lib/topics";

const HREFS = { chairFlyHref: "/train/chair-fly", radioPracticeHref: "/train/radio-practice" };
const EVIDENCE = { label: "Danny · Aug 20", text: "Lost thirty feet in the turn." };

describe("VectorTrainingSession — one bounded interaction, never a growing chat", () => {
  it("hands off to the real Chair Fly engine with a real link -- no question, no textarea, when there's nothing curated to diagnose with", () => {
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Crosswind landings"
        isPhysicalSkill
        evidence={EVIDENCE}
        diagnosticQuestion={null}
        rehearsal={{ kind: "chair-fly" }}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/item-1/evaluate"
      />,
    );
    expect(markup).toContain('href="/train/chair-fly"');
    expect(markup).toContain("Rehearse with Vector");
    expect(markup).not.toContain("<textarea");
  });

  it("hands off to the real Radio Practice engine with a real link", () => {
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Radio communications"
        isPhysicalSkill={false}
        evidence={EVIDENCE}
        diagnosticQuestion={null}
        rehearsal={{ kind: "radio-practice" }}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/item-1/evaluate"
      />,
    );
    expect(markup).toContain('href="/train/radio-practice"');
    expect(markup).toContain("Start Radio Practice");
    expect(markup).not.toContain("<textarea");
  });

  it("presents the one reviewed diagnostic question and nothing else before an answer is submitted -- bounded, not an open chat", () => {
    const guidance = curatedTrainingGuidance("STEEP_TURNS")!;
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Steep turns"
        isPhysicalSkill
        evidence={EVIDENCE}
        diagnosticQuestion={{ prompt: guidance.checkQuestion!.prompt, explanation: guidance.checkQuestion!.explanation }}
        rehearsal={null}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/item-1/evaluate"
      />,
    ).replace(/&#x27;/g, "'");
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
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Steep turns"
        isPhysicalSkill
        evidence={EVIDENCE}
        diagnosticQuestion={{ prompt: guidance.checkQuestion!.prompt, explanation: guidance.checkQuestion!.explanation }}
        rehearsal={null}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/item-1/evaluate"
      />,
    ).replace(/&#x27;/g, "'");
    expect(markup).toContain("Lost thirty feet in the turn.");
    expect(markup).toContain("Danny · Aug 20");
    // The evidence quote and the reviewed question prompt render as
    // distinct blocks, not concatenated into one paragraph.
    const evidenceIndex = markup.indexOf("Lost thirty feet in the turn.");
    const questionIndex = markup.indexOf(guidance.checkQuestion!.prompt);
    expect(evidenceIndex).toBeGreaterThan(-1);
    expect(questionIndex).toBeGreaterThan(evidenceIndex);
  });

  it("degrades honestly, never fabricating a question or an engine, when there's no curated content and no rehearsal engine for this skill", () => {
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="this focus"
        isPhysicalSkill={false}
        evidence={{ label: "Danny · Aug 20", text: "Generally a good flight today." }}
        diagnosticQuestion={null}
        rehearsal={null}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/item-1/evaluate"
      />,
    );
    expect(markup).toContain("Nothing prepared for this yet");
    expect(markup).not.toContain("<textarea");
  });
});
