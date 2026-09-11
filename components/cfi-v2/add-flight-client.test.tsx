import { describe, expect, it } from "vitest";
import { cfiV2AddFlightDestination } from "./add-flight-client";

describe("cfiV2AddFlightDestination — a successful CFI V2 flight creation stays inside CFI V2", () => {
  it("routes back to the CFI V2 student record, not a legacy flight-detail page", () => {
    expect(cfiV2AddFlightDestination("student-1")).toBe("/cfi-v2/students/student-1");
  });

  it("never points at legacy /flights/:id or anywhere outside /cfi-v2/**", () => {
    const destination = cfiV2AddFlightDestination("student-1");

    expect(destination).not.toMatch(/^\/flights\//);
    expect(destination.startsWith("/cfi-v2/")).toBe(true);
  });

  it("is keyed to whichever student was passed in, not a fixed id", () => {
    expect(cfiV2AddFlightDestination("student-2")).toBe("/cfi-v2/students/student-2");
  });
});
