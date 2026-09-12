import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { evaluateVectorAnswer } from "@/lib/ai/vector-coach";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";
import type { TrainingItem } from "@/lib/types";

vi.mock("@/lib/auth/guard", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/data", () => ({ getRepository: vi.fn() }));
vi.mock("@/lib/ai/vector-coach", () => ({ evaluateVectorAnswer: vi.fn() }));

function viewer(studentId = "student-1"): Viewer {
  return {
    user: { id: studentId, name: "Regular Student", email: "s@example.com", authUserId: "s@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
    organization: {
      id: "org-1",
      name: "Falcon Aviation",
      kind: "school",
      defaultGuidanceMode: "freeform",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: null,
      subscriptionQuantity: 1,
      demoExpiresAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    role: "student",
  } as unknown as Viewer;
}

function trainingItem(overrides: Partial<TrainingItem> = {}): TrainingItem {
  return {
    id: "item-1",
    flightId: "flight-1",
    debriefId: "debrief-1",
    category: "keep_working_on",
    description: "Steep turns lost some altitude in the second one.",
    done: false,
    completedAt: null,
    visibility: "shared",
    createdAt: "2026-08-20T20:00:00.000Z",
    ...overrides,
  };
}

function requestBody(body: object): Request {
  return new Request("http://localhost/api/train/vector/item-1/evaluate", { method: "POST", body: JSON.stringify(body) });
}

function fakeRepo(items: TrainingItem[] = []) {
  return {
    listTrainingItems: vi.fn().mockResolvedValue(items),
    listTrainingSignals: vi.fn().mockResolvedValue([]),
    listFlightTasks: vi.fn().mockResolvedValue([]),
    getDebriefByFlight: vi.fn().mockResolvedValue(null),
    listFlights: vi.fn().mockResolvedValue([]),
    listReservations: vi.fn().mockResolvedValue([]),
  };
}

function params(itemId: string) {
  return { params: Promise.resolve({ itemId }) };
}

describe("POST /api/train/vector/[itemId]/evaluate", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("requires authentication -- an unauthenticated caller gets authorize()'s own response, never a fallback evaluation", async () => {
    const authResponse = NextResponse.json({ error: "Not signed in" }, { status: 401 });
    vi.mocked(authorize).mockResolvedValue({ response: authResponse } as never);

    const res = await POST(requestBody({ answer: "Because load factor increases." }), params("item-1"));
    expect(res.status).toBe(401);
    expect(getRepository).not.toHaveBeenCalled();
  });

  it("404s for an item id that doesn't belong to this student -- ownership is enforced at the query, not trusted from the URL", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    vi.mocked(getRepository).mockReturnValue(fakeRepo([]) as never);

    const res = await POST(requestBody({ answer: "Some answer." }), params("someone-elses-item"));
    expect(res.status).toBe(404);
  });

  it("404s for an item resolving to a skill with no reviewed check question -- never invents one to fill the gap", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    vi.mocked(getRepository).mockReturnValue(fakeRepo([trainingItem({ description: "Generally a good flight today." })]) as never);

    const res = await POST(requestBody({ answer: "Some answer." }), params("item-1"));
    expect(res.status).toBe(404);
  });

  it("400s on an empty answer", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    vi.mocked(getRepository).mockReturnValue(fakeRepo([trainingItem()]) as never);
    const res = await POST(requestBody({ answer: "   " }), params("item-1"));
    expect(res.status).toBe(400);
  });

  it("scopes the item lookup to the signed-in student's own id, never a hardcoded or fixture student", async () => {
    const repo = fakeRepo([trainingItem()]);
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer("student-42") } as never);
    vi.mocked(getRepository).mockReturnValue(repo as never);

    await POST(requestBody({ answer: "Because load factor increases with bank." }), params("item-1"));

    expect(repo.listTrainingItems).toHaveBeenCalledWith({ studentId: "student-42" });
  });

  it("degrades gracefully to the reviewed explanation, never an invented one, when there is no API key", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    vi.mocked(getRepository).mockReturnValue(fakeRepo([trainingItem()]) as never);

    const res = await POST(requestBody({ answer: "Because load factor increases with bank." }), params("item-1"));
    const body = (await res.json()) as { evaluation: { feedback: string; takeaway: string; matchedConcepts: string[] }; citation: unknown };

    expect(res.status).toBe(200);
    expect(body.evaluation.matchedConcepts).toEqual([]);
    expect(body.evaluation.feedback).toMatch(/load factor/i);
    expect(body.evaluation.takeaway).toBe(body.evaluation.feedback);
    expect(body.citation).toEqual({ source: expect.stringContaining("Airplane Flying Handbook"), url: expect.any(String) });
  });
});

describe("strategy -- decided only after this real answer, never preselected from the skill alone, never a score threshold used as a universal modality selector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
  });

  it("legitimately re-opens Chair Fly once diagnosis is solid, for a skill that has one -- understanding is now established, not assumed", async () => {
    vi.mocked(getRepository).mockReturnValue(fakeRepo([trainingItem({ description: "Crosswind correction was late on the last two landings." })]) as never); // resolves to CROSSWIND_LANDING -- has an authored Chair Fly scenario
    vi.mocked(evaluateVectorAnswer).mockResolvedValue({
      matchedConcepts: [
        "aileron controls drift / holds the wing into the wind",
        "rudder keeps the nose tracking the centerline",
        "they're two different jobs, not one combined input",
        "relaxing aileron too early after touchdown lets the wind pick up the wing or drift the airplane",
      ],
      feedback: "You've got it.",
      takeaway: "Keep leading the rollout.",
    });

    const res = await POST(requestBody({ answer: "A full, correct answer." }), params("item-1"));
    const body = (await res.json()) as { strategy: { kind: string } };

    expect(body.strategy).toEqual({ kind: "chair-fly" });
  });

  it("returns transfer with an explicit flight-transfer objective when there's no rehearsal engine and no real gap left", async () => {
    vi.mocked(getRepository).mockReturnValue(fakeRepo([trainingItem()]) as never); // STEEP_TURNS -- no rehearsal engine
    vi.mocked(evaluateVectorAnswer).mockResolvedValue({
      matchedConcepts: ["steeper bank increases load factor", "more back-pressure/elevator is needed to maintain altitude at higher bank angles", "not enough back-pressure results in altitude loss"],
      feedback: "You've got it.",
      takeaway: "Add back-pressure as bank increases.",
    });

    const res = await POST(requestBody({ answer: "A full, correct answer." }), params("item-1"));
    const body = (await res.json()) as { strategy: { kind: string; objective?: string } };

    expect(body.strategy).toEqual({ kind: "transfer", objective: expect.stringContaining("Add back-pressure as bank increases.") });
  });

  it("returns transfer, never an infinite retry, for a weak answer with no rehearsal engine either", async () => {
    vi.mocked(getRepository).mockReturnValue(fakeRepo([trainingItem()]) as never);
    vi.mocked(evaluateVectorAnswer).mockResolvedValue({ matchedConcepts: [], feedback: "You missed the load factor point.", takeaway: "Add back-pressure as bank increases." });

    const res = await POST(requestBody({ answer: "I'm not sure." }), params("item-1"));
    const body = (await res.json()) as { strategy: { kind: string } };

    expect(body.strategy.kind).toBe("transfer");
  });
});

describe("route gating -- a real authenticated production endpoint, not a copy of the prototype route", () => {
  it("has no environment gating at all -- unlike app/api/prototype/vector/route.ts, this route is authorize()-gated only, so it works the same in every environment", () => {
    const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/isProduction|isStaging|isSiteGateEnabled/);
    expect(source).toMatch(/authorize\(\)/);
  });
});
