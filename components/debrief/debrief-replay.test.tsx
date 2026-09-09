import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DebriefReplay } from "./debrief-replay";
import type { StructuredDebrief } from "@/lib/types";

const BASE_RESULT: StructuredDebrief = {
  flightSummary: "",
  narrativeRecap: "",
  whatWeDid: [],
  wentWell: ["Smooth landings"],
  needsWork: ["Radio calls"],
  instructorGuidance: [],
  instructorAssistance: [],
  riskManagementNotes: [],
  assessmentDifferences: [],
  actionItems: [],
  nextLessonFocus: ["Crosswind landings"],
  studyReferences: [{ topic: "Crosswind landings", source: "AFH Ch. 9", url: "", why: "" }],
  nextFlightCue: "",
  nextFlightCueContext: "",
};

const BASE_PROPS = {
  flightId: "flight-1",
  result: BASE_RESULT,
  recurringTheme: null,
  certificateType: null,
  canEditCue: false,
  handoff: { keepWorkingOn: [], beforeFlightItems: [] },
};

describe("DebriefReplay — never implies an instructor on a Solo flight", () => {
  it("omits every instructor mention when instructor is null", () => {
    const markup = renderToStaticMarkup(<DebriefReplay {...BASE_PROPS} instructor={null} />);

    expect(markup).not.toMatch(/your instructor/i);
    expect(markup).not.toMatch(/with your instructor/i);
    expect(markup).toMatch(/From your debrief(?!\s*with)/);
  });

  it("names the instructor in every attribution line when one exists", () => {
    const markup = renderToStaticMarkup(<DebriefReplay {...BASE_PROPS} instructor={{ id: "i1", name: "Jake" }} />);

    expect(markup).toMatch(/From your debrief with Jake/);
    expect(markup).toMatch(/Recommended Before Your Next Lesson/);
    expect(markup).toMatch(/Based on your debrief with Jake/);
  });
});
