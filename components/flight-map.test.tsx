import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FlightMap } from "./flight-map";

describe("FlightMap — honest empty state", () => {
  it("renders no map path when track is null -- the exact state a Staging/Production flight with no real telemetry now persists", () => {
    const markup = renderToStaticMarkup(<FlightMap track={null} hasAdsbLookup={false} />);

    expect(markup).toContain("No flight path to show.");
    expect(markup).toMatch(/logged by hand/);
  });

  it("renders no map path when track has fewer than two usable points", () => {
    const markup = renderToStaticMarkup(<FlightMap track={[{ lat: 33.3, lon: -111.7, timestamp: "2026-09-08T16:00:00.000Z" }]} />);

    expect(markup).toContain("No flight path to show.");
  });
});
