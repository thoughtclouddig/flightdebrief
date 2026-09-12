import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";

vi.mock("@/lib/auth/guard", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/data", () => ({ getRepository: vi.fn() }));

function viewer(overrides: Partial<Viewer["organization"]> = {}, role: Viewer["role"] = "student"): Viewer {
  return {
    user:
      role === "student"
        ? { id: "student-1", name: "Regular Student", email: "s@example.com", authUserId: "s@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true }
        : { id: "cfi-1", name: "Danny Franks", email: "cfi@example.com", authUserId: "cfi@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
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
      ...overrides,
    },
    role,
  } as unknown as Viewer;
}

function requestBody(body: object): Request {
  return new Request("http://localhost/api/radio-practice/assign", { method: "POST", body: JSON.stringify(body) });
}

function fakeRepo(opts: { items?: Array<Record<string, unknown>> } = {}) {
  return {
    listMembers: vi.fn().mockResolvedValue([{ userId: "student-1" }]),
    createRadioPracticeAssignment: vi.fn().mockImplementation((input) => Promise.resolve({ id: "assignment-1", ...input })),
    listTrainingItems: vi.fn().mockResolvedValue(opts.items ?? []),
    listTrainingSignals: vi.fn().mockResolvedValue([]),
    listFlightTasks: vi.fn().mockResolvedValue([]),
    getDebriefByFlight: vi.fn().mockResolvedValue(null),
  };
}

describe("POST /api/radio-practice/assign — student access is not gated on org kind", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("a school student with a CFI on the roster can start their own practice (assignedBy: null)", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "school" }) } as never);
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "student-1", assignedBy: null }),
    );
  });

  it("an individual-org student can still start their own practice (the previously-only-supported case)", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "individual" }) } as never);
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "student-1", assignedBy: null }),
    );
  });

  it("an independent-CFI-org student can start their own practice", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "independent_cfi" }) } as never);
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "student-1", assignedBy: null }),
    );
  });

  it("a CFI assigning to a roster student still records real provenance (assignedBy set)", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "school" }, "instructor") } as never);
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis", studentId: "student-1" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "student-1", assignedBy: "cfi-1" }),
    );
  });
});

describe("POST /api/radio-practice/assign — the Vector return-path link is re-verified, never trusted from the client alone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links the assignment to a training item this student really owns", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "school" }) } as never);
    const repo = fakeRepo({
      items: [{ id: "item-1", flightId: "flight-1", debriefId: "debrief-1", category: "keep_working_on", description: "Radio calls on downwind were rushed.", done: false, completedAt: null, visibility: "shared", createdAt: "2026-01-01T00:00:00.000Z" }],
    });
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis", trainingItemId: "item-1" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(expect.objectContaining({ trainingItemId: "item-1" }));
  });

  it("silently drops a trainingItemId that doesn't resolve to this student's own owned item -- never errors the whole attempt over it", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "school" }) } as never);
    const repo = fakeRepo({ items: [] }); // no items at all -- "item-1" belongs to nobody this repo view can see
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis", trainingItemId: "item-1" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(expect.objectContaining({ trainingItemId: null }));
  });

  it("stores trainingItemId: null for a normal standalone practice request with no linkage at all", async () => {
    vi.mocked(authorize).mockResolvedValue({ viewer: viewer({ kind: "school" }) } as never);
    const repo = fakeRepo();
    vi.mocked(getRepository).mockReturnValue(repo as never);

    const res = await POST(requestBody({ scenarioId: "initial-atis" }));
    expect(res.status).toBe(200);
    expect(repo.createRadioPracticeAssignment).toHaveBeenCalledWith(expect.objectContaining({ trainingItemId: null }));
  });
});
