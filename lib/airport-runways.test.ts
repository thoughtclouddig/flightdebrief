import { describe, it, expect } from "vitest";
import { runwayFromTrack, runwayNumber, snapToRunway, summarizeRunways, type RunwayTrack } from "./airport-runways";
import type { TrackPoints } from "./airport-tracks";

const KFFZ = { lat: 33.4608, lon: -111.7283 };
/** Roughly Falcon Field's magnetic variation, degrees east. */
const VAR = 10.5;

/** A point n nautical miles from the field on a true bearing, as [lon, lat]. */
function at(nm: number, bearing: number): [number, number] {
  const rad = (bearing * Math.PI) / 180;
  const lat = KFFZ.lat + (nm / 60) * Math.cos(rad);
  const lon = KFFZ.lon + ((nm / 60) * Math.sin(rad)) / Math.cos((KFFZ.lat * Math.PI) / 180);
  return [lon, lat];
}

/** An approach tracking inbound on `courseTrue`, from `fromNm` out to the field. */
function approach(courseTrue: number, fromNm = 1.8): TrackPoints {
  const outbound = (courseTrue + 180) % 360;
  const points: TrackPoints = [];
  for (let d = fromNm; d >= 0.1; d -= 0.2) points.push(at(d, outbound));
  return points;
}

describe("runwayNumber", () => {
  it("converts a true heading to the magnetic number painted on the runway", () => {
    // 45 true at 10.5 east variation is 34.5 magnetic -> runway 03.
    expect(runwayNumber(45, VAR)).toBe("03");
    // Ignoring variation would call this 05, a whole runway number out.
    expect(runwayNumber(45, 0)).toBe("05");
  });

  it("calls north 36 rather than 00", () => {
    expect(runwayNumber(0, 0)).toBe("36");
    expect(runwayNumber(359, 0)).toBe("36");
  });

  it("wraps past 360", () => {
    expect(runwayNumber(5, 10)).toBe("36");
  });
});

describe("runwayFromTrack", () => {
  it("reads the runway off an approach", () => {
    // Inbound on 45 true = 34.5 magnetic = runway 03.
    expect(runwayFromTrack(approach(45), KFFZ, VAR, "arrival")).toBe("03");
  });

  it("reverses the heading for a departure", () => {
    // The same geometry read as a departure is the opposite direction.
    const climbOut: TrackPoints = [...approach(45)].reverse();
    expect(runwayFromTrack(climbOut, KFFZ, VAR, "departure")).toBe("21");
  });

  it("refuses to guess when the track never settles on a heading", () => {
    // Points near the field but scattered around it -- a circuit or a
    // go-around, not an alignment. Snapping this to the nearest runway would
    // be a confident wrong answer.
    const wandering: TrackPoints = [at(1.5, 0), at(1.2, 90), at(1.0, 180), at(1.3, 270), at(0.9, 45)];
    expect(runwayFromTrack(wandering, KFFZ, VAR, "arrival")).toBeNull();
  });

  it("refuses when too few points are near the field", () => {
    expect(runwayFromTrack([at(1.0, 200), at(0.5, 200)], KFFZ, VAR, "arrival")).toBeNull();
  });

  it("ignores the part of the track that is far from the field", () => {
    // A flight that wandered the practice area then flew a clean approach
    // should be read off the approach, not the wandering.
    const track: TrackPoints = [at(12, 300), at(9, 60), at(6, 150), ...approach(45)];
    expect(runwayFromTrack(track, KFFZ, VAR, "arrival")).toBe("03");
  });
});

describe("summarizeRunways", () => {
  it("counts a local flight at both ends", () => {
    // A real local flight: climbs out, goes somewhere, comes back. Built as
    // both legs rather than one approach reversed -- a single inbound track
    // only ever contains one direction of travel, and reading it as a
    // departure just returns the same runway again.
    const climbOut: TrackPoints = [];
    for (let d = 0.1; d <= 1.8; d += 0.2) climbOut.push(at(d, 45));
    const local: RunwayTrack = { kind: "local", points: [...climbOut, at(9, 45), ...approach(45)] };

    const { runways, classified } = summarizeRunways([local], KFFZ, VAR);
    // Departed on 03 and landed back on 03: one runway, one of each.
    expect(classified).toBe(2);
    expect(runways).toHaveLength(1);
    expect(runways[0]).toMatchObject({ runway: "03", arrivals: 1, departures: 1, total: 2 });
  });

  it("lets one flight use different runways at each end", () => {
    // The wind shifted during the lesson. Departed 03, came back on 21.
    const climbOut: TrackPoints = [];
    for (let d = 0.1; d <= 1.8; d += 0.2) climbOut.push(at(d, 45));
    const local: RunwayTrack = { kind: "local", points: [...climbOut, at(9, 45), ...approach(225)] };

    const { runways } = summarizeRunways([local], KFFZ, VAR);
    expect(runways.map((r) => r.runway).sort()).toEqual(["03", "21"]);
  });

  it("ranks runways by use and reports what it could not classify", () => {
    const clean = Array.from({ length: 4 }, () => ({ kind: "arrival" as const, points: approach(45) }));
    const messy: RunwayTrack = {
      kind: "arrival",
      points: [at(1.5, 0), at(1.2, 90), at(1.0, 180), at(1.3, 270), at(0.9, 45)],
    };
    const { runways, classified, unclassified } = summarizeRunways([...clean, messy], KFFZ, VAR);
    expect(runways[0].runway).toBe("03");
    expect(runways[0].share).toBe(1);
    expect(classified).toBe(4);
    expect(unclassified).toBe(1);
  });
});

describe("snapToRunway", () => {
  it("picks the field's own runway rather than rounding to any number", () => {
    // 47 true would round to 05; this field only has 04 and 22, so 04 it is.
    expect(snapToRunway(47, ["4L/22R", "4R/22L"])).toBe("04");
    expect(snapToRunway(228, ["4L/22R"])).toBe("22");
  });

  it("drops the parallel suffix, which a track cannot resolve", () => {
    expect(snapToRunway(45, ["4L/22R", "4R/22L"])).toBe("04");
  });

  it("refuses when nothing is close enough to be that runway", () => {
    // Lined up on 180 at a field with only 04/22 is not a landing here.
    expect(snapToRunway(180, ["4L/22R"])).toBeNull();
  });

  it("returns null rather than guessing when no runways are known", () => {
    expect(snapToRunway(45, [])).toBeNull();
  });
});
