import { describe, expect, it } from "vitest";
import { checkFlightComplete, initialLandingState, stepLandingState } from "./landing-state-machine";
import { DEFAULT_TRACKING_THRESHOLDS, type TrackingSnapshot } from "./types";

function snapshot(overrides: Partial<TrackingSnapshot>): TrackingSnapshot {
  return {
    providerFlightId: "p1",
    tailNumber: "N12345",
    lat: 33.3,
    lon: -111.7,
    altitudeFt: 2000,
    groundSpeedKt: 100,
    timestamp: "2026-01-01T00:00:00.000Z",
    nearestAirport: "KFFZ",
    distanceFromAirportNm: 5,
    ...overrides,
  };
}

const T = DEFAULT_TRACKING_THRESHOLDS;

describe("stepLandingState", () => {
  it("moves unknown -> airborne when the aircraft is clearly flying", () => {
    const result = stepLandingState(initialLandingState(), snapshot({}), T);
    expect(result.state.state).toBe("airborne");
    expect(result.event).toBe("airborne_detected");
  });

  it("stays unknown while parked before any flight is detected", () => {
    const onGround = snapshot({ groundSpeedKt: 0, distanceFromAirportNm: 0.1 });
    const result = stepLandingState(initialLandingState(), onGround, T);
    expect(result.state.state).toBe("unknown");
    expect(result.event).toBeNull();
  });

  it("moves airborne -> possible_landing when speed and proximity look like a landing", () => {
    const airborne = { state: "airborne" as const, possibleLandingSince: null };
    const landing = snapshot({ groundSpeedKt: 3, distanceFromAirportNm: 0.2, timestamp: "2026-01-01T00:05:00.000Z" });
    const result = stepLandingState(airborne, landing, T);
    expect(result.state.state).toBe("possible_landing");
    expect(result.state.possibleLandingSince).toBe("2026-01-01T00:05:00.000Z");
    expect(result.event).toBe("landing_detected");
  });

  it("confirms the landing once min-time-on-ground elapses", () => {
    const possibleLanding = { state: "possible_landing" as const, possibleLandingSince: "2026-01-01T00:05:00.000Z" };
    const stillOnGround = snapshot({
      groundSpeedKt: 2,
      distanceFromAirportNm: 0.1,
      timestamp: "2026-01-01T00:08:01.000Z", // 181s later, threshold is 180s
    });
    const result = stepLandingState(possibleLanding, stillOnGround, T);
    expect(result.state.state).toBe("on_ground_confirmed");
    expect(result.event).toBe("ground_confirmed");
  });

  it("does not confirm the landing before min-time-on-ground elapses", () => {
    const possibleLanding = { state: "possible_landing" as const, possibleLandingSince: "2026-01-01T00:05:00.000Z" };
    const stillOnGround = snapshot({
      groundSpeedKt: 2,
      distanceFromAirportNm: 0.1,
      timestamp: "2026-01-01T00:06:00.000Z", // only 60s later
    });
    const result = stepLandingState(possibleLanding, stillOnGround, T);
    expect(result.state.state).toBe("possible_landing");
    expect(result.event).toBeNull();
  });

  it("detects a touch-and-go when speed picks back up before the landing is confirmed", () => {
    const possibleLanding = { state: "possible_landing" as const, possibleLandingSince: "2026-01-01T00:05:00.000Z" };
    const climbingAgain = snapshot({
      groundSpeedKt: 80,
      distanceFromAirportNm: 1,
      timestamp: "2026-01-01T00:05:20.000Z",
    });
    const result = stepLandingState(possibleLanding, climbingAgain, T);
    expect(result.state.state).toBe("airborne");
    expect(result.event).toBe("touch_and_go_detected");
  });

  it("stays put once on_ground_confirmed -- further snapshots don't re-trigger events", () => {
    const confirmed = { state: "on_ground_confirmed" as const, possibleLandingSince: null };
    const result = stepLandingState(confirmed, snapshot({ groundSpeedKt: 0 }), T);
    expect(result.state.state).toBe("on_ground_confirmed");
    expect(result.event).toBeNull();
  });
});

describe("checkFlightComplete", () => {
  it("declares flight_complete once the aircraft has been silent past the threshold after ground_confirmed", () => {
    const confirmed = { state: "on_ground_confirmed" as const, possibleLandingSince: null };
    const result = checkFlightComplete(confirmed, "2026-01-01T00:08:00.000Z", "2026-01-01T00:11:01.000Z", T);
    expect(result.state.state).toBe("flight_complete");
    expect(result.event).toBe("flight_complete");
  });

  it("does not declare flight_complete before the silence threshold elapses", () => {
    const confirmed = { state: "on_ground_confirmed" as const, possibleLandingSince: null };
    const result = checkFlightComplete(confirmed, "2026-01-01T00:08:00.000Z", "2026-01-01T00:09:00.000Z", T);
    expect(result.state.state).toBe("on_ground_confirmed");
    expect(result.event).toBeNull();
  });

  it("is a no-op outside on_ground_confirmed", () => {
    const airborne = { state: "airborne" as const, possibleLandingSince: null };
    const result = checkFlightComplete(airborne, "2026-01-01T00:08:00.000Z", "2026-01-01T01:00:00.000Z", T);
    expect(result.state.state).toBe("airborne");
    expect(result.event).toBeNull();
  });
});
