import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SkillProgressList } from "./skill-progress-list";
import type { SkillProgression } from "@/lib/skill-progress";

function progression(overrides: Partial<SkillProgression>): SkillProgression {
  return {
    skill: "CROSSWIND_LANDING",
    label: "Crosswind landings",
    category: "MANEUVERS",
    status: "Needs Coaching",
    history: [{ signalId: "s1", flightId: "f1", flightDate: "2026-08-01", status: "NEEDS_COACHING" }],
    latestSignalId: "s1",
    ...overrides,
  };
}

describe("SkillProgressList school audience", () => {
  it("never renders the internal 'Needs Coaching' term -- School V2 sees the approved V2 label instead", () => {
    const markup = renderToStaticMarkup(
      <SkillProgressList
        progressions={[progression({ status: "Needs Coaching" })]}
        certificateType={null}
        audience="school"
      />,
    );

    expect(markup).not.toContain("Needs Coaching");
    expect(markup).toContain("Needs Work");
  });

  it("flattens Developing/Improving to the single approved 'Improving' term", () => {
    const markup = renderToStaticMarkup(
      <SkillProgressList
        progressions={[
          progression({ skill: "SHORT_FIELD_LANDING", label: "Short field landings", status: "Developing" }),
          progression({ skill: "STEEP_TURNS", label: "Steep turns", status: "Improving" }),
        ]}
        certificateType={null}
        audience="school"
      />,
    );

    expect(markup).not.toContain("Developing");
    expect((markup.match(/Improving/g) ?? []).length).toBe(2);
  });

  it("maps Demonstrated to Meets Standard", () => {
    const markup = renderToStaticMarkup(
      <SkillProgressList progressions={[progression({ status: "Demonstrated" })]} certificateType={null} audience="school" />,
    );

    expect(markup).toContain("Meets Standard");
    expect(markup).not.toContain("Demonstrated");
  });

  it("keeps Introduced distinct instead of folding it into Improving -- one flight of history isn't evidence of a trend", () => {
    const markup = renderToStaticMarkup(
      <SkillProgressList progressions={[progression({ status: "Introduced" })]} certificateType={null} audience="school" />,
    );

    expect(markup).toContain("Introduced");
  });

  it("leaves the internal/CFI audience presentation exactly as before by default", () => {
    const markup = renderToStaticMarkup(<SkillProgressList progressions={[progression({ status: "Needs Coaching" })]} certificateType={null} />);

    expect(markup).toContain("Needs Coaching");
  });
});
