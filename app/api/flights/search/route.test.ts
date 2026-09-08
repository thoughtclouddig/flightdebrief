import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/lib/auth/guard";
import { getFlightDataProvider } from "@/lib/flight-data";
import { GET } from "./route";
import type { Viewer } from "@/lib/viewer";
import type { FlightDataProvider } from "@/lib/flight-data";

vi.mock("@/lib/auth/guard", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/flight-data", () => ({ getFlightDataProvider: vi.fn() }));

const viewer = {
  user: { id: "user-1", name: "Real Student", email: "real@example.com", authUserId: "real@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
  organization: { id: "org-1", name: "Real School", kind: "school", defaultGuidanceMode: "freeform", stripeCustomerId: null, stripeSubscriptionId: null, subscriptionStatus: null, subscriptionPlan: null, subscriptionQuantity: 1, demoExpiresAt: null, createdAt: "2026-01-01T00:00:00.000Z" },
  role: "student",
} as unknown as Viewer;

function request(tail: string): Request {
  return new Request(`http://localhost/api/flights/search?tail=${tail}`);
}

describe("GET /api/flights/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer });
  });

  it("returns an honest empty result when no provider is available (Staging/Production, no FR24_API_KEY) -- never a fabricated candidate list", async () => {
    vi.mocked(getFlightDataProvider).mockReturnValue(null);

    const res = await GET(request("N728DE"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.candidates).toEqual([]);
    expect(json.provider).toBe("unavailable");
  });

  it("uses the real provider's candidates when one is available", async () => {
    const fakeProvider: FlightDataProvider = {
      name: "fr24",
      searchFlightsByTailNumber: vi.fn().mockResolvedValue([
        { providerFlightId: "fr24-123", tailNumber: "N728DE", aircraftType: "DA40", callsign: null, departureAirport: "KFFZ", arrivalAirport: "KCHD", scheduledDeparture: "2026-09-08T16:00:00.000Z", scheduledArrival: null, durationMinutes: 75 },
      ]),
      getFlight: vi.fn(),
      getFlightTrack: vi.fn(),
    };
    vi.mocked(getFlightDataProvider).mockReturnValue(fakeProvider);

    const res = await GET(request("N728DE"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.provider).toBe("fr24");
    expect(json.candidates).toHaveLength(1);
    expect(json.candidates[0].providerFlightId).toBe("fr24-123");
  });

  it("a genuine zero-candidate FR24 response reports the real provider name, distinct from provider-unavailable", async () => {
    const fakeProvider: FlightDataProvider = {
      name: "fr24",
      searchFlightsByTailNumber: vi.fn().mockResolvedValue([]),
      getFlight: vi.fn(),
      getFlightTrack: vi.fn(),
    };
    vi.mocked(getFlightDataProvider).mockReturnValue(fakeProvider);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const res = await GET(request("OXF6250"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.candidates).toEqual([]);
    expect(json.provider).toBe("fr24");
    expect(json.provider).not.toBe("unavailable");
    // Zero-result requests are logged, unlike before -- the server-side gap
    // that made this case indistinguishable from provider-unavailable in
    // Staging logs.
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("returned zero candidates for tail=OXF6250"));
    logSpy.mockRestore();
  });

  it("a provider error surfaces as a 502 with no candidates -- never a silent empty or fabricated result", async () => {
    const fakeProvider: FlightDataProvider = {
      name: "fr24",
      searchFlightsByTailNumber: vi.fn().mockRejectedValue(new Error("FR24 request failed (401): unauthorized")),
      getFlight: vi.fn(),
      getFlightTrack: vi.fn(),
    };
    vi.mocked(getFlightDataProvider).mockReturnValue(fakeProvider);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET(request("N728DE"));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.candidates).toBeUndefined();
    expect(json.error).toMatch(/unauthorized/i);
    errorSpy.mockRestore();
  });
});
