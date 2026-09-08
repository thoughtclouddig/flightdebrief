import { afterEach, describe, expect, it, vi } from "vitest";
import { getFlightDataProvider } from "@/lib/flight-data";
import { GET } from "./route";
import type { FlightDataProvider } from "@/lib/flight-data";

vi.mock("@/lib/flight-data", () => ({ getFlightDataProvider: vi.fn() }));

const FR24_PROVIDER: FlightDataProvider = {
  name: "fr24",
  searchFlightsByTailNumber: vi.fn(),
  getFlight: vi.fn(),
  getFlightTrack: vi.fn(),
};

describe("GET /api/staging/runtime-check", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("404s in production", async () => {
    vi.stubEnv("APP_ENV", "production");

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("404s in development", async () => {
    vi.stubEnv("APP_ENV", "development");

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("reports fr24ApiKey true and flightDataProvider fr24 when the key is present and the provider resolves to FR24", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("FR24_API_KEY", "test-key");
    vi.mocked(getFlightDataProvider).mockReturnValue(FR24_PROVIDER);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.environment.fr24ApiKey).toBe(true);
    expect(json.flightDataProvider).toBe("fr24");
  });

  it("reports fr24ApiKey false and flightDataProvider unavailable when the key is absent and the provider resolves to null", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("FR24_API_KEY", "");
    vi.mocked(getFlightDataProvider).mockReturnValue(null);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.environment.fr24ApiKey).toBe(false);
    expect(json.flightDataProvider).toBe("unavailable");
  });

  it("reports flightDataProvider unavailable even if the key is present but the resolved provider isn't fr24 -- reflects the real singleton, not just key presence", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("FR24_API_KEY", "test-key");
    vi.mocked(getFlightDataProvider).mockReturnValue(null);

    const res = await GET();
    const json = await res.json();

    expect(json.environment.fr24ApiKey).toBe(true);
    expect(json.flightDataProvider).toBe("unavailable");
  });

  it("reports deployment as a boolean reflecting REPLIT_DEPLOYMENT presence", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("REPLIT_DEPLOYMENT", "1");
    vi.mocked(getFlightDataProvider).mockReturnValue(null);

    const res = await GET();
    const json = await res.json();

    expect(json.deployment).toBe(true);
  });

  it("never includes a secret value, length, or any field beyond the closed diagnostic shape", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@host:5432/db");
    vi.stubEnv("SESSION_SECRET", "super-secret-value");
    vi.stubEnv("FR24_API_KEY", "fr24-secret-key");
    vi.stubEnv("DEEPGRAM_API_KEY", "deepgram-secret-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-secret-key");
    vi.stubEnv("RESEND_API_KEY", "resend-secret-key");
    vi.mocked(getFlightDataProvider).mockReturnValue(FR24_PROVIDER);

    const res = await GET();
    const text = await res.text();

    for (const secret of [
      "postgres://user:pass@host:5432/db",
      "super-secret-value",
      "fr24-secret-key",
      "deepgram-secret-key",
      "anthropic-secret-key",
      "resend-secret-key",
      "host:5432",
    ]) {
      expect(text).not.toContain(secret);
    }

    const json = JSON.parse(text);
    expect(Object.keys(json).sort()).toEqual(["appEnv", "deployment", "environment", "flightDataProvider"]);
    expect(Object.keys(json.environment).sort()).toEqual(
      ["anthropicApiKey", "databaseUrl", "deepgramApiKey", "fr24ApiKey", "resendApiKey", "sessionSecret"].sort(),
    );
    for (const value of Object.values(json.environment)) {
      expect(typeof value).toBe("boolean");
    }
  });
});
