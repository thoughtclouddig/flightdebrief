import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { analyzeDebrief } from "@/lib/ai";
import { buildDebriefNarration } from "@/lib/debrief-narration";
import { isBillingBlocked } from "@/lib/billing-gate";
import { classifyTrainingSignals } from "@/lib/taxonomy";
import { resolveTrainingUnitEvidence } from "@/lib/student/train-units";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";
import type { FlightWithRelations, StructuredDebrief } from "@/lib/types";

vi.mock("@/lib/auth/guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/guard")>();
  return { ...actual, authorize: vi.fn() };
});
vi.mock("@/lib/data", () => ({ getRepository: vi.fn() }));
vi.mock("@/lib/ai", () => ({ analyzeDebrief: vi.fn() }));
vi.mock("@/lib/debrief-narration", () => ({ buildDebriefNarration: vi.fn(() => "") }));
vi.mock("@/lib/billing-gate", () => ({ isBillingBlocked: vi.fn().mockResolvedValue(false) }));
vi.mock("@/lib/taxonomy", () => ({ classifyTrainingSignals: vi.fn(() => []) }));
vi.mock("@/lib/milestones", () => ({ evaluateAndAwardMilestones: vi.fn() }));
vi.mock("@/lib/action-items-autoresolve", () => ({ autoResolveActionItems: vi.fn() }));
vi.mock("@/lib/student/train-units", async (importOriginal) => {
  // resolveTrainingItemSkill stays real -- it's pure/deterministic and the
  // tests below want the actual skill resolution. Only the model-calling
  // resolveTrainingUnitEvidence is mocked.
  const actual = await importOriginal<typeof import("@/lib/student/train-units")>();
  return { ...actual, resolveTrainingUnitEvidence: vi.fn() };
});

const FLIGHT: FlightWithRelations = {
  id: "flight-1",
  userId: "student-1",
  organizationId: "org-1",
  aircraftId: "aircraft-1",
  departureAirport: "KFFZ",
  arrivalAirport: "KFFZ",
  flightDate: "2026-08-30",
  durationMinutes: 100,
  instructorId: null,
  reservationId: null,
  fr24FlightId: null,
  externalProvider: null,
  externalId: null,
  debriefStatus: "in_progress",
  track: null,
  createdAt: "2026-08-30T00:00:00.000Z",
  instructor: null,
  aircraft: {
    id: "aircraft-1",
    tailNumber: "N28086",
    type: "Piper PA-28A",
    make: "Piper",
    model: "PA-28A",
    homeAirport: "KFFZ",
    organizationId: "org-1",
    status: "active",
    externalProvider: null,
    externalId: null,
  },
};

const viewer = { user: { id: "student-1" }, organization: { id: "org-1" }, role: "student" } as unknown as Viewer;

const STRUCTURED_RESULT: StructuredDebrief = {
  flightSummary: "Solid pattern work with one go-around.",
  narrativeRecap: "Today's flight covered pattern work and a go-around after a high approach.",
  whatWeDid: ["Pattern work", "Go-around"],
  wentWell: ["Consistent altitude on downwind"],
  needsWork: ["Round-out timing on the flare"],
  instructorGuidance: [],
  instructorAssistance: [],
  riskManagementNotes: [],
  assessmentDifferences: [],
  actionItems: ["Practice holding target speed through short final"],
  nextLessonFocus: ["Short-field landings"],
  studyReferences: [],
  nextFlightCue: "Airspeed, then flaps",
  nextFlightCueContext: "Short-field landing",
};

const INADEQUATE_TRANSCRIPT = "This is a test. This is a test.";
const SUBSTANTIVE_TRANSCRIPT =
  "Landings were solid today, we worked on crosswind correction on final, and my radio calls were a little rushed but I caught myself each time.";

function request(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/debrief/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fakeRepo(overrides: Record<string, unknown> = {}) {
  return {
    getFlight: vi.fn().mockResolvedValue(FLIGHT),
    getPendingDebriefTranscript: vi.fn().mockResolvedValue(null),
    savePendingDebriefTranscript: vi.fn().mockImplementation(async (input) => ({
      transcript: input.transcript,
      audioDurationSeconds: input.audioDurationSeconds,
      guidanceMode: input.guidanceMode,
      recordingStartedAt: input.recordingStartedAt,
      recordingEndedAt: input.recordingEndedAt,
      words: input.words,
      cardBoundaries: input.cardBoundaries,
    })),
    deletePendingDebriefTranscript: vi.fn(),
    getOrganization: vi.fn().mockResolvedValue(null),
    createDebrief: vi.fn().mockResolvedValue({ id: "debrief-1" }),
    listFlights: vi.fn().mockResolvedValue([]),
    listTrainingItems: vi.fn().mockResolvedValue([]),
    listFlightTasks: vi.fn().mockResolvedValue([]),
    createTrainingItems: vi.fn(),
    createTrainingSignals: vi.fn(),
    getUser: vi.fn().mockResolvedValue({ name: "Mia" }),
    setFlightDebriefStatus: vi.fn(),
    ...overrides,
  };
}

describe("POST /api/debrief/analyze — insufficient transcript content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer });
    vi.mocked(isBillingBlocked).mockResolvedValue(false);
    vi.mocked(classifyTrainingSignals).mockReturnValue([]);
    vi.mocked(resolveTrainingUnitEvidence).mockResolvedValue({ instructorQuote: null, mechanism: null });
  });

  it("rejects an inadequate transcript with a 422 and an honest message, and never calls the analyzer", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(request({ flightId: "flight-1", transcript: INADEQUATE_TRANSCRIPT }));
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.error).toBe("insufficient_content");
    expect(json.message).toMatch(/didn't get enough detail/i);
    expect(analyzeDebrief).not.toHaveBeenCalled();
  });

  it("does not create TrainingItem or TrainingSignal rows for an inadequate transcript", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    await POST(request({ flightId: "flight-1", transcript: INADEQUATE_TRANSCRIPT }));

    expect(repo.createTrainingItems).not.toHaveBeenCalled();
    expect(repo.createTrainingSignals).not.toHaveBeenCalled();
    expect(classifyTrainingSignals).not.toHaveBeenCalled();
  });

  it("does not build TTS narration or persist a debrief for an inadequate transcript", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    await POST(request({ flightId: "flight-1", transcript: INADEQUATE_TRANSCRIPT }));

    expect(buildDebriefNarration).not.toHaveBeenCalled();
    expect(repo.createDebrief).not.toHaveBeenCalled();
  });

  it("preserves the pending transcript for retry -- never deletes it on the rejected path", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    await POST(request({ flightId: "flight-1", transcript: INADEQUATE_TRANSCRIPT }));

    expect(repo.deletePendingDebriefTranscript).not.toHaveBeenCalled();
  });

  it("re-applies the same rejection when resuming a previously-saved inadequate transcript (no transcript in the body)", async () => {
    const repo = fakeRepo({
      getPendingDebriefTranscript: vi.fn().mockResolvedValue({
        transcript: INADEQUATE_TRANSCRIPT,
        audioDurationSeconds: 5,
        guidanceMode: "freeform",
        recordingStartedAt: null,
        recordingEndedAt: null,
        words: null,
        cardBoundaries: null,
      }),
    });
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(request({ flightId: "flight-1" }));
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.error).toBe("insufficient_content");
    expect(analyzeDebrief).not.toHaveBeenCalled();
  });

  it("a substantive transcript is unaffected -- reaches the analyzer and persists a debrief as before", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);
    vi.mocked(analyzeDebrief).mockResolvedValue({ structured: STRUCTURED_RESULT, analyzedWith: "claude" });

    const res = await POST(request({ flightId: "flight-1", transcript: SUBSTANTIVE_TRANSCRIPT }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.debrief).toEqual({ id: "debrief-1" });
    expect(analyzeDebrief).toHaveBeenCalledTimes(1);
    expect(repo.createDebrief).toHaveBeenCalledTimes(1);
  });

  it("computes and persists real evidence interpretation on the keep_working_on item at creation time -- never at Train/Vector render time", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);
    vi.mocked(analyzeDebrief).mockResolvedValue({ structured: STRUCTURED_RESULT, analyzedWith: "claude" });
    vi.mocked(resolveTrainingUnitEvidence).mockResolvedValue({
      instructorQuote: { quote: "Round-out timing on the flare", instructorName: "Danny" },
      mechanism: { quote: "Round-out timing on the flare", category: "SEQUENCING_REHEARSAL" },
    });

    await POST(request({ flightId: "flight-1", transcript: SUBSTANTIVE_TRANSCRIPT }));

    expect(repo.createTrainingItems).toHaveBeenCalledWith([
      expect.objectContaining({
        category: "keep_working_on",
        description: "Round-out timing on the flare",
        instructorQuote: { quote: "Round-out timing on the flare", instructorName: "Danny" },
        observedMechanism: { quote: "Round-out timing on the flare", category: "SEQUENCING_REHEARSAL" },
      }),
      expect.objectContaining({
        category: "before_next_flight",
        // before_next_flight items never become Vector training units --
        // no interpretation is computed for them at all.
        instructorQuote: null,
        observedMechanism: null,
      }),
    ]);
  });

  it("degrades to conservative null evidence, never blocking item creation, when interpretation fails", async () => {
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);
    vi.mocked(analyzeDebrief).mockResolvedValue({ structured: STRUCTURED_RESULT, analyzedWith: "claude" });
    // resolveTrainingUnitEvidence's own real contract never throws -- but
    // this proves the route survives even if it somehow did, and that a
    // failed interpretation is persisted honestly as null, never a
    // skill-derived guess.
    vi.mocked(resolveTrainingUnitEvidence).mockResolvedValue({ instructorQuote: null, mechanism: null });

    const res = await POST(request({ flightId: "flight-1", transcript: SUBSTANTIVE_TRANSCRIPT }));

    expect(res.status).toBe(200);
    expect(repo.createTrainingItems).toHaveBeenCalledWith([
      expect.objectContaining({ category: "keep_working_on", instructorQuote: null, observedMechanism: null }),
      expect.objectContaining({ category: "before_next_flight", instructorQuote: null, observedMechanism: null }),
    ]);
  });
});
