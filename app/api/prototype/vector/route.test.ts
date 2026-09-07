import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// hasValidSiteGateCookie() calls next/headers' cookies(), which throws
// outside a real request scope. Stubbed to an empty jar (no gate cookie) --
// the case this route's staging branch exists to block.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

// Staging-RC-0 touches app/prototype/layout.tsx only. This locks in that the
// backing API route's own, separately-implemented guard (Platform Hardening
// P0-5 / 2B) is unaffected by that change.
function postRequest(body: unknown) {
  return new Request("http://localhost/api/prototype/vector", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/prototype/vector environment guard (unchanged by Staging-RC-0)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is blocked in production", async () => {
    vi.stubEnv("APP_ENV", "production");

    const res = await POST(postRequest({ intent: "grade", questionId: "q1", optionId: "b" }));

    expect(res.status).toBe(404);
  });

  it("is blocked in staging when the site gate is enabled and no gate cookie is present", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("SITE_ACCESS_CODE", "test-gate-code");

    const res = await POST(postRequest({ intent: "grade", questionId: "q1", optionId: "b" }));

    expect(res.status).toBe(404);
  });

  it("is not gated in staging when SITE_ACCESS_CODE is unset", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("SITE_ACCESS_CODE", "");

    const res = await POST(postRequest({ intent: "grade", questionId: "q1", optionId: "b" }));

    expect(res.status).toBe(200);
  });

  it("answers a real knowledge-check question in development", async () => {
    vi.stubEnv("APP_ENV", "development");

    const res = await POST(postRequest({ intent: "grade", questionId: "q1", optionId: "b" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.correct).toBe(true);
  });
});
