import { afterEach, describe, expect, it, vi } from "vitest";
import { FR24Provider } from "./fr24-provider";

/**
 * Provider -> normalized FlightCandidate mapping. Real fetch mocked at the
 * global level (not calling out to fr24api.flightradar24.com), everything
 * else -- URL construction, headers, response-shape mapping -- runs for
 * real. This is the exact layer that produced the N728DE "UNKNOWN ->
 * KFFZ" regression report: FR24 can return `orig_icao: null` for a flight
 * that never distinctly left one field's vicinity even when `dest_icao`
 * resolves fine, and that null must survive as an honest empty string here,
 * not be silently coerced into something else.
 */
function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      text: async () => JSON.stringify(body),
      json: async () => body,
    }),
  );
}

describe("FR24Provider — searchFlightsByTailNumber mapping", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a normal flight with both airports resolved straight through, unchanged", async () => {
    mockFetchOnce({
      data: [
        {
          fr24_id: "fr24-abc",
          reg: "n728de",
          type: "DA40",
          callsign: "N728DE",
          orig_icao: "KFFZ",
          dest_icao: "KCHD",
          datetime_takeoff: "2026-09-09T16:00:00",
          datetime_landed: "2026-09-09T17:00:00",
        },
      ],
    });

    const provider = new FR24Provider("test-key");
    const [candidate] = await provider.searchFlightsByTailNumber("N728DE");

    expect(candidate.departureAirport).toBe("KFFZ");
    expect(candidate.arrivalAirport).toBe("KCHD");
    expect(candidate.tailNumber).toBe("N728DE");
    expect(candidate.durationMinutes).toBe(60);
  });

  it("the N728DE shape: a null orig_icao survives as an empty string, not a fabricated value", async () => {
    mockFetchOnce({
      data: [
        {
          fr24_id: "fr24-n728de",
          reg: "n728de",
          type: "DA40",
          callsign: "N728DE",
          orig_icao: null,
          dest_icao: "KFFZ",
          datetime_takeoff: "2026-09-09T16:00:00",
          datetime_landed: "2026-09-09T17:00:00",
        },
      ],
    });

    const provider = new FR24Provider("test-key");
    const [candidate] = await provider.searchFlightsByTailNumber("N728DE");

    expect(candidate.departureAirport).toBe("");
    expect(candidate.arrivalAirport).toBe("KFFZ");
  });

  it("a missing (undefined) orig_icao/dest_icao is treated the same as an explicit null", async () => {
    mockFetchOnce({ data: [{ fr24_id: "fr24-x", reg: "n1", datetime_takeoff: null, datetime_landed: null }] });

    const provider = new FR24Provider("test-key");
    const [candidate] = await provider.searchFlightsByTailNumber("N1");

    expect(candidate.departureAirport).toBe("");
    expect(candidate.arrivalAirport).toBe("");
    expect(candidate.durationMinutes).toBeNull();
  });

  it("computes durationMinutes from the real takeoff/landed timestamps, not a guess", async () => {
    mockFetchOnce({
      data: [
        {
          fr24_id: "fr24-y",
          reg: "n2",
          orig_icao: "KFFZ",
          dest_icao: "KFFZ",
          datetime_takeoff: "2026-09-09T16:00:00",
          datetime_landed: "2026-09-09T16:45:00",
        },
      ],
    });

    const provider = new FR24Provider("test-key");
    const [candidate] = await provider.searchFlightsByTailNumber("N2");

    expect(candidate.durationMinutes).toBe(45);
  });

  it("no results maps to an empty candidate list, not a crash", async () => {
    mockFetchOnce({ data: [] });
    const provider = new FR24Provider("test-key");
    const candidates = await provider.searchFlightsByTailNumber("N999ZZ");
    expect(candidates).toEqual([]);
  });

  it("propagates a real API failure as a thrown error rather than a silently-empty result", async () => {
    mockFetchOnce({ message: "bad request" }, false);
    const provider = new FR24Provider("test-key");
    await expect(provider.searchFlightsByTailNumber("N728DE")).rejects.toThrow(/FR24 request failed/);
  });
});

describe("FR24Provider — getFlightTrack mapping", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps real track points through with their genuine coordinates and telemetry, unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "",
        json: async () => [
          {
            fr24_id: "fr24-abc",
            tracks: [{ timestamp: "2026-09-09T16:00:00Z", lat: 33.4634, lon: -111.728, alt: 1200, gspeed: 65 }],
          },
        ],
      }),
    );

    const provider = new FR24Provider("test-key");
    const track = await provider.getFlightTrack("fr24-abc");

    expect(track).toEqual([
      { lat: 33.4634, lon: -111.728, altitudeFt: 1200, groundSpeedKt: 65, timestamp: "2026-09-09T16:00:00Z" },
    ]);
  });
});
