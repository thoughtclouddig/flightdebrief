import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isDevelopment } from "@/lib/env";
import { seedCfiV2Demo, seedPilotDemo, seedSchoolV2Demo } from "@/lib/demo/live-demo-seed";
import { GET } from "./route";

// after() requires a real Next.js request-scoped AsyncLocalStorage context
// that doesn't exist when a route handler is invoked directly in a unit
// test -- irrelevant to what this file actually tests (the redirect-path
// decision), so it's replaced with a no-op here rather than skipped.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});
vi.mock("@/lib/env", () => ({ isDevelopment: vi.fn() }));
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, createSessionJwt: vi.fn().mockResolvedValue("fake-jwt") };
});
vi.mock("@/lib/demo/live-demo-seed", () => ({
  seedPilotDemo: vi.fn(),
  seedCfiV2Demo: vi.fn(),
  seedSchoolV2Demo: vi.fn(),
  cleanupExpiredDemoOrgs: vi.fn().mockResolvedValue(0),
}));

function demoRequest(persona: string): NextRequest {
  return new NextRequest(`http://localhost/api/demo/start?persona=${persona}`, {
    headers: { host: "getafterflight.com" },
  });
}

const CFI_RESULT = {
  organizationId: "org-cfi",
  loginUserId: "user-cfi",
  loginEmail: "cfi@example.com",
  loginName: "Steve Ceefi",
  redirectPath: "/cfi/today" as const,
  hint: "cfi hint",
};

const SCHOOL_RESULT = {
  organizationId: "org-school",
  loginUserId: "user-admin",
  loginEmail: "admin@example.com",
  loginName: "Taylor Admin",
  redirectPath: "/admin/overview" as const,
  hint: "school hint",
};

/**
 * isDevelopment() is a boolean, and Staging/Production are code-path
 * identical for this route today -- both make it false, since nothing here
 * distinguishes them beyond development-or-not. Three explicit environment
 * cases are still written out (rather than collapsed to "dev/not-dev") so
 * this test reads as the release contract it protects: CFI/School V2
 * routing must not vary by environment, in any of the three real ones.
 */
const ENVIRONMENTS: { label: string; isDev: boolean }[] = [
  { label: "Development", isDev: true },
  { label: "Staging", isDev: false },
  { label: "Production", isDev: false },
];

describe("GET /api/demo/start — CFI V2 and School V2 are released, not environment-gated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(seedCfiV2Demo).mockResolvedValue(CFI_RESULT);
    vi.mocked(seedSchoolV2Demo).mockResolvedValue(SCHOOL_RESULT);
  });

  it.each(ENVIRONMENTS)("$label: persona=cfi redirects to /cfi-v2, not canonical /cfi/today", async ({ isDev }) => {
    vi.mocked(isDevelopment).mockReturnValue(isDev);

    const res = await GET(demoRequest("cfi"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://getafterflight.com/cfi-v2");
  });

  it.each(ENVIRONMENTS)("$label: persona=school redirects to /school-v2, not canonical /admin/overview", async ({ isDev }) => {
    vi.mocked(isDevelopment).mockReturnValue(isDev);

    const res = await GET(demoRequest("school"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://getafterflight.com/school-v2");
  });

  it("persona=cfi-v2 (the legacy alias) still requires Development -- unaffected by this release", async () => {
    vi.mocked(isDevelopment).mockReturnValue(false);

    const res = await GET(demoRequest("cfi-v2"));

    expect(res.status).toBe(400);
  });

  it("persona=pilot-real still requires Development -- unaffected by this release", async () => {
    vi.mocked(isDevelopment).mockReturnValue(false);

    const res = await GET(demoRequest("pilot-real"));

    expect(res.status).toBe(400);
  });

  it("persona=pilot-real still works in Development, resolving to real-data /v2", async () => {
    vi.mocked(isDevelopment).mockReturnValue(true);
    vi.mocked(seedPilotDemo).mockResolvedValue({
      organizationId: "org-jordan",
      loginUserId: "user-jordan",
      loginEmail: "jordan@example.com",
      loginName: "Jordan",
      redirectPath: "/home",
      hint: "pilot-real hint",
    });

    const res = await GET(demoRequest("pilot-real"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://getafterflight.com/v2");
  });
});
