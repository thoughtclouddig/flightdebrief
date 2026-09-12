import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";
import type { TrainingSignal } from "@/lib/types";

vi.mock("@/lib/auth/guard", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/data", () => ({ getRepository: vi.fn() }));

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

function signal(overrides: Partial<TrainingSignal> = {}): TrainingSignal {
  return {
    id: "signal-1",
    organizationId: "org-1",
    studentId: "student-1",
    instructorId: "cfi-1",
    aircraftId: null,
    flightId: "flight-1",
    debriefId: "debrief-1",
    flightDate: "2026-08-20",
    category: "MANEUVERS",
    skill: "STEEP_TURNS",
    status: "NEEDS_COACHING",
    source: "INSTRUCTOR",
    statement: "Lost thirty feet in the turn.",
    dismissed: false,
    ...overrides,
  } as TrainingSignal;
}

function requestBody(body: object): Request {
  return new Request("http://localhost/api/train/vector/STEEP_TURNS/evaluate", { method: "POST", body: JSON.stringify(body) });
}

function fakeRepo(signals: TrainingSignal[] = []) {
  return { listTrainingSignals: vi.fn().mockResolvedValue(signals) };
}

function params(skill: string) {
  return { params: Promise.resolve({ skill }) };
}

describe("POST /api/train/vector/[skill]/evaluate", () => {
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

    const res = await POST(requestBody({ answer: "Because load factor increases." }), params("STEEP_TURNS"));
    expect(res.status).toBe(401);
    expect(getRepository).not.toHaveBeenCalled();
  });

  it("404s for a skill with no reviewed check question -- never invents one to fill the gap", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    const res = await POST(requestBody({ answer: "Some answer." }), params("PREFLIGHT_INSPECTION"));
    expect(res.status).toBe(404);
  });

  it("400s on an empty answer", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    vi.mocked(getRepository).mockReturnValue(fakeRepo() as never);
    const res = await POST(requestBody({ answer: "   " }), params("STEEP_TURNS"));
    expect(res.status).toBe(400);
  });

  it("scopes evidence to the signed-in student's own id, never a hardcoded or fixture student", async () => {
    const repo = fakeRepo([signal()]);
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer("student-42") } as never);
    vi.mocked(getRepository).mockReturnValue(repo as never);

    await POST(requestBody({ answer: "Because load factor increases with bank." }), params("STEEP_TURNS"));

    expect(repo.listTrainingSignals).toHaveBeenCalledWith({ studentId: "student-42" });
  });

  it("degrades gracefully to the reviewed explanation, never an invented one, when there is no API key", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer() } as never);
    vi.mocked(getRepository).mockReturnValue(fakeRepo([signal()]) as never);

    const res = await POST(requestBody({ answer: "Because load factor increases with bank." }), params("STEEP_TURNS"));
    const body = (await res.json()) as { evaluation: { feedback: string; takeaway: string; matchedConcepts: string[] }; citation: unknown };

    expect(res.status).toBe(200);
    expect(body.evaluation.matchedConcepts).toEqual([]);
    expect(body.evaluation.feedback).toMatch(/load factor/i);
    expect(body.evaluation.takeaway).toBe(body.evaluation.feedback);
    expect(body.citation).toEqual({ source: expect.stringContaining("Airplane Flying Handbook"), url: expect.any(String) });
  });
});

describe("route gating -- a real authenticated production endpoint, not a copy of the prototype route", () => {
  it("has no environment gating at all -- unlike app/api/prototype/vector/route.ts, this route is authorize()-gated only, so it works the same in every environment", () => {
    const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/isProduction|isStaging|isSiteGateEnabled/);
    expect(source).toMatch(/authorize\(\)/);
  });
});
