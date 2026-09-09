import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeWithClaude } from "./claude-analyzer";
import { analyzeMock } from "./mock-analyzer";
import { analyzeDebrief } from "./index";
import type { AnalyzeDebriefInput, StructuredDebriefResult } from "./schema";

vi.mock("./claude-analyzer", () => ({ analyzeWithClaude: vi.fn() }));
vi.mock("./mock-analyzer", () => ({ analyzeMock: vi.fn() }));

const BASE_RESULT: StructuredDebriefResult = {
  flightSummary: "KFFZ pattern work.",
  narrativeRecap: "",
  whatWeDid: [],
  wentWell: [],
  needsWork: [],
  instructorGuidance: [],
  instructorAssistance: [],
  riskManagementNotes: [],
  actionItems: [],
  nextLessonFocus: [],
  nextFlightCue: "",
  nextFlightCueContext: "",
  studyReferences: [],
  assessmentDifferences: [],
};

function input(overrides: Partial<AnalyzeDebriefInput["flightMeta"]>): AnalyzeDebriefInput {
  return {
    transcript: "Real transcript.",
    flightMeta: {
      tailNumber: "N728DE",
      aircraftType: "DA40",
      departureAirport: "KFFZ",
      arrivalAirport: "KFFZ",
      flightDate: "2026-09-09",
      durationMinutes: 60,
      instructorName: null,
      hasInstructor: false,
      ...overrides,
    },
    previousActionItems: [],
  };
}

describe("analyzeDebrief — solo flight, the real Staging defect", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });
  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = original;
  });

  it('strips a Claude response that says "you and your instructor" for a solo flight before returning it', async () => {
    vi.mocked(analyzeWithClaude).mockResolvedValue({
      ...BASE_RESULT,
      narrativeRecap: "Today you and your instructor identified a few things to work on.",
    });

    const { structured } = await analyzeDebrief(input({ hasInstructor: false }));

    expect(structured.narrativeRecap).toBe("");
  });

  it("never supplies assessmentDifferences (instructor assessment data) for a solo flight", async () => {
    vi.mocked(analyzeWithClaude).mockResolvedValue(BASE_RESULT);

    const { structured } = await analyzeDebrief(input({ hasInstructor: false })); // no assessmentDifferences passed in input

    expect(structured.assessmentDifferences).toEqual([]);
  });

  it("also validates the mock-analyzer fallback path when Claude throws", async () => {
    vi.mocked(analyzeWithClaude).mockRejectedValue(new Error("Claude unavailable"));
    vi.mocked(analyzeMock).mockReturnValue({
      ...BASE_RESULT,
      wentWell: ["You and your instructor nailed the crosswind landing"],
    });

    const { structured, analyzedWith } = await analyzeDebrief(input({ hasInstructor: false }));

    expect(analyzedWith).toBe("mock");
    expect(structured.wentWell).toEqual([]);
  });

  it("also validates the mock analyzer when no API key is configured at all", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.mocked(analyzeMock).mockReturnValue({
      ...BASE_RESULT,
      needsWork: ["Instructor noticed drift on final"],
    });

    const { structured, analyzedWith } = await analyzeDebrief(input({ hasInstructor: false }));

    expect(analyzedWith).toBe("mock");
    expect(structured.needsWork).toEqual([]);
  });
});

describe("analyzeDebrief — instructor flight retains truthful instructor-aware content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("passes a real named instructor's content through unchanged", async () => {
    vi.mocked(analyzeWithClaude).mockResolvedValue({
      ...BASE_RESULT,
      narrativeRecap: "Today you and Jake identified a few things to work on.",
      instructorGuidance: [{ instructorName: "Jake", quote: "Hold that speed a little longer" }],
    });

    const { structured } = await analyzeDebrief(input({ hasInstructor: true, instructorName: "Jake" }));

    expect(structured.narrativeRecap).toBe("Today you and Jake identified a few things to work on.");
    expect(structured.instructorGuidance).toEqual([{ instructorName: "Jake", quote: "Hold that speed a little longer" }]);
  });

  it("supplies real assessmentDifferences through to the result when actual instructor assessment data exists", async () => {
    vi.mocked(analyzeWithClaude).mockResolvedValue(BASE_RESULT);
    const diffs: AnalyzeDebriefInput["assessmentDifferences"] = [
      { taskLabel: "Crosswind Landings", studentLevel: "LEARNING", instructorLevel: "NEEDS_COACHING", note: "" },
    ];

    const { structured } = await analyzeDebrief({
      ...input({ hasInstructor: true, instructorName: "Jake" }),
      assessmentDifferences: diffs,
    });

    expect(structured.assessmentDifferences).toEqual(diffs);
  });
});
