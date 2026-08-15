import { describe, expect, it } from "vitest";
import { clampScore, gaugeGeometry, strokeOffsetFor } from "./flight-score-gauge";

describe("clampScore", () => {
  it("passes through an in-range score unchanged", () => {
    expect(clampScore(82)).toBe(82);
  });

  it("clamps above 100 down to 100", () => {
    expect(clampScore(140)).toBe(100);
  });

  it("clamps below 0 up to 0", () => {
    expect(clampScore(-20)).toBe(0);
  });
});

describe("gaugeGeometry", () => {
  it("derives radius from size and stroke width", () => {
    const { radius } = gaugeGeometry(200, 12);
    expect(radius).toBe(94); // (200 - 12) / 2
  });

  it("derives circumference from the radius", () => {
    const { radius, circumference } = gaugeGeometry(200, 12);
    expect(circumference).toBeCloseTo(2 * Math.PI * radius, 5);
  });
});

describe("strokeOffsetFor", () => {
  const circumference = 100; // round number for easy math

  it("is 0 (fully filled) at score 100", () => {
    expect(strokeOffsetFor(100, circumference)).toBeCloseTo(0, 5);
  });

  it("is the full circumference (empty) at score 0", () => {
    expect(strokeOffsetFor(0, circumference)).toBeCloseTo(circumference, 5);
  });

  it("is half the circumference at score 50", () => {
    expect(strokeOffsetFor(50, circumference)).toBeCloseTo(circumference / 2, 5);
  });

  it("clamps out-of-range scores before computing the offset", () => {
    expect(strokeOffsetFor(150, circumference)).toBeCloseTo(0, 5);
    expect(strokeOffsetFor(-50, circumference)).toBeCloseTo(circumference, 5);
  });
});
