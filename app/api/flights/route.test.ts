import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { getFlightDataProvider } from "@/lib/flight-data";
import { isDevelopment } from "@/lib/env";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";
import type { FlightDataProvider } from "@/lib/flight-data";

vi.mock("@/lib/auth/guard", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/data", () => ({ getRepository: vi.fn() }));
vi.mock("@/lib/flight-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/flight-data")>();
  return { ...actual, getFlightDataProvider: vi.fn() };
});
vi.mock("@/lib/env", () => ({ isDevelopment: vi.fn() }));

const viewer = {
  user: { id: "user-1", name: "Real Student", email: "real@example.com", authUserId: "real@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
  organization: { id: "org-1", name: "Real School", kind: "school", defaultGuidanceMode: "freeform", stripeCustomerId: null, stripeSubscriptionId: null, subscriptionStatus: null, subscriptionPlan: null, subscriptionQuantity: 1, demoExpiresAt: null, createdAt: "2026-01-01T00:00:00.000Z" },
  role: "student",
} as unknown as Viewer;

const REAL_TRACK = [{ lat: 33.3, lon: -111.7, timestamp: "2026-09-08T16:00:00.000Z" }];

function requestBody(body: object): Request {
  return new Request("http://localhost/api/flights", { method: "POST", body: JSON.stringify(body) });
}

function fakeRepo(createFlightImpl = vi.fn().mockResolvedValue({ id: "flight-1" })) {
  return {
    getOrCreateAircraft: vi.fn().mockResolvedValue({ id: "aircraft-1" }),
    getOrCreateInstructor: vi.fn(),
    createFlight: createFlightImpl,
  };
}

const baseBody = {
  tailNumber: "N728DE",
  aircraftType: "DA40",
  departureAirport: "KFFZ",
  arrivalAirport: "KCHD",
  flightDate: "2026-09-08",
  durationMinutes: 75,
};

describe("POST /api/flights — provider provenance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer });
  });

  it("Staging/Production: a mock-provider id is stripped -- fr24FlightId and track both persist null, provider is never even consulted", async () => {
    vi.mocked(isDevelopment).mockReturnValue(false);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    const res = await POST(requestBody({ ...baseBody, providerFlightId: "mock-N728DE-0" }));

    expect(res.status).toBe(200);
    expect(getFlightDataProvider).not.toHaveBeenCalled();
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ fr24FlightId: null, track: null }));
  });

  it("Staging/Production: a genuine (non-mock) provider id still fetches a real track when a provider is configured", async () => {
    vi.mocked(isDevelopment).mockReturnValue(false);
    const provider: FlightDataProvider = {
      name: "fr24",
      searchFlightsByTailNumber: vi.fn(),
      getFlight: vi.fn(),
      getFlightTrack: vi.fn().mockResolvedValue(REAL_TRACK),
    };
    vi.mocked(getFlightDataProvider).mockReturnValue(provider);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    const res = await POST(requestBody({ ...baseBody, providerFlightId: "fr24-abc123" }));

    expect(res.status).toBe(200);
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ fr24FlightId: "fr24-abc123", track: REAL_TRACK }));
  });

  it("Staging/Production: no provider configured (null) and a genuine id -- track persists null, no crash", async () => {
    vi.mocked(isDevelopment).mockReturnValue(false);
    vi.mocked(getFlightDataProvider).mockReturnValue(null);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    const res = await POST(requestBody({ ...baseBody, providerFlightId: "fr24-abc123" }));

    expect(res.status).toBe(200);
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ fr24FlightId: "fr24-abc123", track: null }));
  });

  it("Development: a mock-provider id is honored as-is (intentional fixture capability, preserved)", async () => {
    vi.mocked(isDevelopment).mockReturnValue(true);
    const provider: FlightDataProvider = {
      name: "mock",
      searchFlightsByTailNumber: vi.fn(),
      getFlight: vi.fn(),
      getFlightTrack: vi.fn().mockResolvedValue(REAL_TRACK),
    };
    vi.mocked(getFlightDataProvider).mockReturnValue(provider);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    const res = await POST(requestBody({ ...baseBody, providerFlightId: "mock-N728DE-0" }));

    expect(res.status).toBe(200);
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ fr24FlightId: "mock-N728DE-0", track: REAL_TRACK }));
  });

  it("manual entry (no providerFlightId at all) is unaffected in any environment: fr24FlightId and track both null, provider never consulted", async () => {
    vi.mocked(isDevelopment).mockReturnValue(false);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    const res = await POST(requestBody({ ...baseBody }));

    expect(res.status).toBe(200);
    expect(getFlightDataProvider).not.toHaveBeenCalled();
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ fr24FlightId: null, track: null }));
  });
});
