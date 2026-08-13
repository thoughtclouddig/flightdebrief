import type { FlightCandidate, FlightDataProvider } from "./types";
import type { TrackPosition } from "@/lib/types";

const FR24_BASE_URL = "https://fr24api.flightradar24.com";

interface FR24FlightSummary {
  fr24_id: string;
  flight?: string | null;
  callsign?: string | null;
  reg?: string | null;
  type?: string | null;
  orig_icao?: string | null;
  dest_icao?: string | null;
  datetime_takeoff?: string | null;
  datetime_landed?: string | null;
}

interface FR24TrackPoint {
  timestamp: string;
  lat: number;
  lon: number;
  alt?: number;
  gspeed?: number;
}

/**
 * Live FlightData provider backed by the Flightradar24 REST API.
 * https://fr24api.flightradar24.com
 *
 * NOTE: endpoint paths/response shapes below follow FR24's documented
 * flight-summary and flight-tracks endpoints as of this writing. Verify
 * against the current FR24 API reference when wiring a real subscription key
 * -- FR24 versions its API via the `Accept-Version` header.
 */
export class FR24Provider implements FlightDataProvider {
  readonly name = "fr24";

  constructor(private readonly apiKey: string) {}

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, FR24_BASE_URL);
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
        "Accept-Version": "v1",
      },
      // Flight history data doesn't need to be re-fetched aggressively.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error(`FR24 request failed (${res.status}): ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  async searchFlightsByTailNumber(tailNumber: string): Promise<FlightCandidate[]> {
    // flight-summary/full requires a datetime range alongside `registrations` -- max 14 days.
    // Training flights are always recent, so "last 14 days" comfortably covers the real use case.
    const now = new Date();
    const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const data = await this.request<{ data: FR24FlightSummary[] }>(
      "/api/flight-summary/full",
      {
        registrations: tailNumber.toUpperCase(),
        flight_datetime_from: toFr24Datetime(from),
        flight_datetime_to: toFr24Datetime(now),
        limit: "10",
      },
    );
    return (data.data ?? []).map(toCandidate);
  }

  async getFlight(providerFlightId: string): Promise<FlightCandidate | null> {
    const data = await this.request<{ data: FR24FlightSummary[] }>(
      "/api/flight-summary/full",
      { flight_ids: providerFlightId },
    );
    const summary = data.data?.[0];
    return summary ? toCandidate(summary) : null;
  }

  async getFlightTrack(providerFlightId: string): Promise<TrackPosition[]> {
    const data = await this.request<{ data: { fr24_id: string; tracks: FR24TrackPoint[] }[] }>(
      "/api/flight-tracks",
      { flight_id: providerFlightId },
    );
    const tracks = data.data?.[0]?.tracks ?? [];
    return tracks.map((p) => ({
      lat: p.lat,
      lon: p.lon,
      altitudeFt: p.alt,
      groundSpeedKt: p.gspeed,
      timestamp: p.timestamp,
    }));
  }
}

/** FR24 wants `YYYY-MM-DDTHH:MM:SS` in UTC, no `Z` suffix (per their flight-summary docs example). */
function toFr24Datetime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "");
}

function toCandidate(s: FR24FlightSummary): FlightCandidate {
  const takeoff = s.datetime_takeoff ?? null;
  const landed = s.datetime_landed ?? null;
  const durationMinutes =
    takeoff && landed
      ? Math.round((new Date(landed).getTime() - new Date(takeoff).getTime()) / 60000)
      : null;

  return {
    providerFlightId: s.fr24_id,
    tailNumber: (s.reg ?? "").toUpperCase(),
    aircraftType: s.type ?? null,
    callsign: s.callsign ?? s.flight ?? null,
    departureAirport: s.orig_icao ?? "",
    arrivalAirport: s.dest_icao ?? "",
    scheduledDeparture: takeoff ?? new Date().toISOString(),
    scheduledArrival: landed,
    durationMinutes,
  };
}
