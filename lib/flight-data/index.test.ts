import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// getFlightDataProvider() resolves and caches once per module instance
// (see its own doc comment) -- vi.resetModules() + a fresh dynamic import
// per test is required so each scenario gets its own unresolved cache,
// exactly the way a real server process only resolves once per env anyway.
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getFlightDataProvider — environment-aware selection", () => {
  it("Development, no FR24_API_KEY: intentionally falls back to the mock provider", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("FR24_API_KEY", "");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider?.name).toBe("mock");
  });

  it("Staging, no FR24_API_KEY: returns null, never a synthetic provider", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("FR24_API_KEY", "");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider).toBeNull();
  });

  it("Production, no FR24_API_KEY: returns null, never a synthetic provider", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("FR24_API_KEY", "");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider).toBeNull();
  });

  it("a deployed runtime with no explicit APP_ENV (REPLIT_DEPLOYMENT fallback resolves to production) also returns null with no key", async () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("REPLIT_DEPLOYMENT", "1");
    vi.stubEnv("FR24_API_KEY", "");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider).toBeNull();
  });

  it("Staging with FR24_API_KEY configured: uses the real provider, not mock", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("FR24_API_KEY", "test-key-not-a-real-credential");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider?.name).toBe("fr24");
  });

  it("Production with FR24_API_KEY configured: uses the real provider, not mock", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("FR24_API_KEY", "test-key-not-a-real-credential");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider?.name).toBe("fr24");
  });

  it("Development with FR24_API_KEY configured: uses the real provider too (the key always wins when present)", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("FR24_API_KEY", "test-key-not-a-real-credential");
    const { getFlightDataProvider } = await import("./index");

    const provider = getFlightDataProvider();

    expect(provider?.name).toBe("fr24");
  });
});

describe("isMockProviderFlightId", () => {
  it("identifies the mock provider's own id format and nothing else", async () => {
    const { isMockProviderFlightId } = await import("./index");

    expect(isMockProviderFlightId("mock-N728DE-0")).toBe(true);
    expect(isMockProviderFlightId("fr24-abc123")).toBe(false);
    expect(isMockProviderFlightId("a1b2c3")).toBe(false);
  });
});
