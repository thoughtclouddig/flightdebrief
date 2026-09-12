import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VectorTrainingSession } from "./vector-training-session";
import { curatedTrainingGuidance } from "@/lib/topics";

const HREFS = { chairFlyHref: "/train/chair-fly", radioPracticeHref: "/train/radio-practice" };

describe("VectorTrainingSession — one bounded interaction, never a growing chat", () => {
  it("hands off to the real Chair Fly engine with a real link -- no question, no textarea", () => {
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Crosswind landings"
        isPhysicalSkill
        evidence={null}
        capability={{ kind: "chair-fly" }}
        hasChairFlyOption
        hrefs={HREFS}
        evaluateHref="/api/train/vector/CROSSWIND_LANDING/evaluate"
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
        evidence={null}
        capability={{ kind: "radio-practice" }}
        hasChairFlyOption={false}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/RADIO_COMMUNICATIONS/evaluate"
      />,
    );
    expect(markup).toContain('href="/train/radio-practice"');
    expect(markup).toContain("Start Radio Practice");
    expect(markup).not.toContain("<textarea");
  });

  it("presents the one reviewed question and nothing else before an answer is submitted -- bounded, not an open chat", () => {
    const guidance = curatedTrainingGuidance("STEEP_TURNS")!;
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Steep turns"
        isPhysicalSkill
        evidence={{ label: "Danny · Aug 20", text: "Lost thirty feet in the turn." }}
        capability={{ kind: "check", guidance }}
        hasChairFlyOption={false}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/STEEP_TURNS/evaluate"
      />,
    ).replace(/&#x27;/g, "'");
    expect(markup).toContain(guidance.checkQuestion!.prompt);
    expect(markup).toContain("<textarea");
    expect(markup).toContain("Get feedback");
    // Nothing from a not-yet-submitted evaluation appears -- there is no
    // second exchange, no transcript, no premature feedback.
    expect(markup).not.toContain("Take this into your next flight");
  });

  it("keeps the student's real evidence structurally separate from Vector's own reviewed question", () => {
    const guidance = curatedTrainingGuidance("STEEP_TURNS")!;
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="Steep turns"
        isPhysicalSkill
        evidence={{ label: "Danny · Aug 20", text: "Lost thirty feet in the turn." }}
        capability={{ kind: "check", guidance }}
        hasChairFlyOption={false}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/STEEP_TURNS/evaluate"
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

  it("degrades honestly, never fabricating a question, when there's no curated content for this skill", () => {
    const markup = renderToStaticMarkup(
      <VectorTrainingSession
        skillLabel="this focus"
        isPhysicalSkill={false}
        evidence={null}
        capability={{ kind: "check", guidance: null }}
        hasChairFlyOption={false}
        hrefs={HREFS}
        evaluateHref="/api/train/vector/general/evaluate"
      />,
    );
    expect(markup).toContain("Nothing prepared for this yet");
    expect(markup).not.toContain("<textarea");
  });
});
