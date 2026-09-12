import { describe, expect, it } from "vitest";
import { matchSkills, suggestStudyReferences } from "@/lib/topics";

describe("matchSkills", () => {
  it("never misclassifies a generic radio-communication statement as tower-specific -- TOWER_READBACKS requires actual tower/clearance content, not just the word 'radio'", () => {
    const skills = matchSkills("I need to work on talking on the radio more confidently during the emergency scenario.");
    expect(skills.map((s) => s.skill)).not.toContain("TOWER_READBACKS");
  });

  it("still classifies a real tower-clearance issue as TOWER_READBACKS", () => {
    const skills = matchSkills("Missed one instruction from tower and had to ask for a repeat.");
    expect(skills.map((s) => s.skill)).toContain("TOWER_READBACKS");
  });
});

describe("suggestStudyReferences", () => {
  it("attaches the literal sentence that triggered each match as `why`", () => {
    const sentences = ["Carried extra airspeed on final and floated during the landing.", "Everything else looked solid."];
    const references = suggestStudyReferences(sentences);

    expect(references.length).toBeGreaterThan(0);
    expect(references[0].why).toBe(sentences[0]);
  });

  it("returns no references when nothing in the sentences matches the topic library", () => {
    expect(suggestStudyReferences(["Great flight, nothing to add."])).toEqual([]);
  });

  it("caps results at 5 and never returns duplicate sources", () => {
    const sentences = [
      "Floated on final due to excess airspeed.",
      "Missed a radio call from tower.",
      "Got behind the aircraft configuring for the pattern.",
      "Bounced the landing in the crosswind.",
      "Struggled with short field technique.",
      "Went around because traffic was on the runway.",
    ];
    const references = suggestStudyReferences(sentences);

    expect(references.length).toBeLessThanOrEqual(5);
    expect(new Set(references.map((r) => r.source)).size).toBe(references.length);
  });
});
