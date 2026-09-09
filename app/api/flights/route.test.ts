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

describe("POST /api/flights — airport resolution (the N728DE 'UNKNOWN -> KFFZ' regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer });
    vi.mocked(isDevelopment).mockReturnValue(false);
  });

  /** A real KFFZ position -- see lib/geo.ts's AIRPORTS. */
  const KFFZ_POINT = { lat: 33.4634, lon: -111.728, timestamp: "2026-09-09T16:00:00.000Z" };
  const FAR_FROM_ANY_KNOWN_AIRPORT = { lat: 33.4484, lon: -112.074, timestamp: "2026-09-09T16:05:00.000Z" };

  function withProvider(track: { lat: number; lon: number; timestamp: string }[]) {
    const provider: FlightDataProvider = {
      name: "fr24",
      searchFlightsByTailNumber: vi.fn(),
      getFlight: vi.fn(),
      getFlightTrack: vi.fn().mockResolvedValue(track),
    };
    vi.mocked(getFlightDataProvider).mockReturnValue(provider);
  }

  it("a valid provider-supplied KFFZ departure is persisted as-is, never overridden by track inference", async () => {
    withProvider([KFFZ_POINT]);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    await POST(requestBody({ ...baseBody, departureAirport: "KFFZ", providerFlightId: "fr24-1" }));

    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ departureAirport: "KFFZ" }));
  });

  it("FR24 leaving departureAirport blank for a real local-pattern flight resolves from the real track's first point, not UNKNOWN", async () => {
    // This is exactly the N728DE shape: FR24 resolved the arrival (KFFZ) but
    // not the departure ICAO for a flight that never left the pattern --
    // real track evidence places the first point right at KFFZ.
    withProvider([KFFZ_POINT, KFFZ_POINT]);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    const res = await POST(
      requestBody({ ...baseBody, departureAirport: "", arrivalAirport: "KFFZ", providerFlightId: "fr24-2" }),
    );

    expect(res.status).toBe(200);
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ departureAirport: "KFFZ", arrivalAirport: "KFFZ" }));
  });

  it("also resolves a blank arrival from the track's last point, symmetric with departure", async () => {
    withProvider([KFFZ_POINT, KFFZ_POINT]);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    await POST(requestBody({ ...baseBody, departureAirport: "KFFZ", arrivalAirport: "", providerFlightId: "fr24-3" }));

    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ departureAirport: "KFFZ", arrivalAirport: "KFFZ" }));
  });

  it("never fabricates an airport when the track's position isn't actually near any known field -- stays honestly UNKNOWN", async () => {
    withProvider([FAR_FROM_ANY_KNOWN_AIRPORT]);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    await POST(requestBody({ ...baseBody, departureAirport: "", arrivalAirport: "KCHD", providerFlightId: "fr24-4" }));

    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ departureAirport: "UNKNOWN" }));
  });

  it("stays UNKNOWN when no track is available at all (no provider configured), exactly as before this fix", async () => {
    vi.mocked(getFlightDataProvider).mockReturnValue(null);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    await POST(requestBody({ ...baseBody, departureAirport: "", arrivalAirport: "", providerFlightId: "fr24-5" }));

    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ departureAirport: "UNKNOWN", arrivalAirport: "UNKNOWN" }));
  });

  it("manual entry with a genuinely blank departure (no providerFlightId, no track) still resolves to UNKNOWN, not a guess", async () => {
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue(fakeRepo(createFlight) as unknown as ReturnType<typeof getRepository>);

    await POST(requestBody({ ...baseBody, departureAirport: "" }));

    expect(getFlightDataProvider).not.toHaveBeenCalled();
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ departureAirport: "UNKNOWN" }));
  });

  it("the aircraft's homeAirport reflects the track-resolved departure, not the pre-resolution UNKNOWN placeholder", async () => {
    withProvider([KFFZ_POINT]);
    const getOrCreateAircraft = vi.fn().mockResolvedValue({ id: "aircraft-1" });
    vi.mocked(getRepository).mockReturnValue({
      getOrCreateAircraft,
      getOrCreateInstructor: vi.fn(),
      createFlight: vi.fn().mockResolvedValue({ id: "flight-1" }),
    } as unknown as ReturnType<typeof getRepository>);

    await POST(requestBody({ ...baseBody, departureAirport: "", providerFlightId: "fr24-6" }));

    expect(getOrCreateAircraft).toHaveBeenCalledWith(expect.objectContaining({ homeAirport: "KFFZ" }));
  });
});

describe("POST /api/flights — guest instructor vs. true Solo (instructorId semantics)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer });
    vi.mocked(isDevelopment).mockReturnValue(false);
  });

  function repoWithInstructor(instructor: { id: string } | null) {
    const getOrCreateInstructor = vi.fn().mockResolvedValue(instructor);
    const createFlight = vi.fn().mockResolvedValue({ id: "flight-1" });
    vi.mocked(getRepository).mockReturnValue({
      getOrCreateAircraft: vi.fn().mockResolvedValue({ id: "aircraft-1" }),
      getOrCreateInstructor,
      createFlight,
    } as unknown as ReturnType<typeof getRepository>);
    return { getOrCreateInstructor, createFlight };
  }

  it("an existing linked instructor's name still resolves to a non-null instructorId", async () => {
    const { getOrCreateInstructor, createFlight } = repoWithInstructor({ id: "instructor-steve" });

    await POST(requestBody({ ...baseBody, instructorName: "Steve Ceefi" }));

    expect(getOrCreateInstructor).toHaveBeenCalledWith("Steve Ceefi", "org-1");
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ instructorId: "instructor-steve" }));
  });

  it("a guest/unlinked instructor's free-text name (the 'Someone else' flow) reaches the same getOrCreateInstructor path and produces a non-null instructorId -- no account required", async () => {
    const { getOrCreateInstructor, createFlight } = repoWithInstructor({ id: "instructor-guest" });

    await POST(requestBody({ ...baseBody, instructorName: "John Smith" }));

    expect(getOrCreateInstructor).toHaveBeenCalledWith("John Smith", "org-1");
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ instructorId: "instructor-guest" }));
  });

  it("true Solo (no instructorName at all) never calls getOrCreateInstructor and persists a null instructorId", async () => {
    const { getOrCreateInstructor, createFlight } = repoWithInstructor(null);

    await POST(requestBody({ ...baseBody, instructorName: undefined }));

    expect(getOrCreateInstructor).not.toHaveBeenCalled();
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ instructorId: null }));
  });

  it("an empty-string instructorName (never submitted, not just omitted) is also treated as Solo, not a name to look up", async () => {
    const { getOrCreateInstructor, createFlight } = repoWithInstructor(null);

    await POST(requestBody({ ...baseBody, instructorName: "" }));

    expect(getOrCreateInstructor).not.toHaveBeenCalled();
    expect(createFlight).toHaveBeenCalledWith(expect.objectContaining({ instructorId: null }));
  });
});
