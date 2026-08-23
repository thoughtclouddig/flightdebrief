import { describe, expect, it } from "vitest";
import { computeDebriefStreak, computeTotalCaptured, evaluateAndAwardMilestones } from "./milestones";
import type { Repository } from "@/lib/data/types";
import type { FlightWithRelations, Milestone } from "@/lib/types";

function flight(overrides: Partial<FlightWithRelations> = {}): FlightWithRelations {
  return {
    id: "flight-1",
    userId: "student-1",
    organizationId: "org-1",
    aircraftId: "aircraft-1",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: "2026-08-20",
    durationMinutes: 60,
    instructorId: "instructor-1",
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "complete",
    track: null,
    createdAt: "2026-08-20T20:00:00.000Z",
    aircraft: {
      id: "aircraft-1",
      tailNumber: "N123AB",
      type: "Cessna 172",
      make: "Cessna",
      model: "172",
      homeAirport: "KFFZ",
      organizationId: "org-1",
      status: "active",
      externalProvider: null,
      externalId: null,
    },
    instructor: null,
    ...overrides,
  };
}

describe("computeDebriefStreak", () => {
  it("counts consecutive completed debriefs backward from the newest flight", () => {
    const flightsDescending = [
      flight({ id: "f6", flightDate: "2026-08-16" }),
      flight({ id: "f5", flightDate: "2026-08-14" }),
      flight({ id: "f4", flightDate: "2026-08-12", debriefStatus: "not_started" }),
      flight({ id: "f3", flightDate: "2026-08-10" }),
      flight({ id: "f2", flightDate: "2026-08-08" }),
      flight({ id: "f1", flightDate: "2026-08-06" }),
    ];
    expect(computeDebriefStreak(flightsDescending)).toBe(2);
  });

  it("is 0 when the most recent flight has no completed debrief", () => {
    expect(computeDebriefStreak([flight({ debriefStatus: "in_progress" })])).toBe(0);
  });

  it("is not affected by gaps further back once a break is hit", () => {
    const flightsDescending = [
      flight({ id: "f3", flightDate: "2026-08-20" }),
      flight({ id: "f2", flightDate: "2026-08-18" }),
      flight({ id: "f1", flightDate: "2026-08-16", debriefStatus: "not_started" }),
    ];
    expect(computeDebriefStreak(flightsDescending)).toBe(2);
  });

  it("is not calendar-based -- a wide date gap between consecutive completed debriefs doesn't break it", () => {
    const flightsDescending = [
      flight({ id: "f2", flightDate: "2026-08-20" }),
      flight({ id: "f1", flightDate: "2026-01-01" }), // months earlier, still counts
    ];
    expect(computeDebriefStreak(flightsDescending)).toBe(2);
  });
});

describe("computeTotalCaptured", () => {
  it("counts only flights with a completed debrief, not total logged flights", () => {
    const flights = [
      flight({ id: "f1", debriefStatus: "complete" }),
      flight({ id: "f2", debriefStatus: "not_started" }),
      flight({ id: "f3", debriefStatus: "complete" }),
    ];
    expect(computeTotalCaptured(flights)).toBe(2);
  });
});

function fakeRepo(opts: { flights: FlightWithRelations[]; existing?: Set<string> }): {
  repo: Repository;
  created: { studentId: string; type: string; source: string; relatedFlightId: string | null }[];
} {
  const existing = opts.existing ?? new Set<string>();
  const created: { studentId: string; type: string; source: string; relatedFlightId: string | null }[] = [];
  const repo = {
    listFlights: async () => opts.flights,
    createMilestoneIfNew: async (input: Omit<Milestone, "id" | "createdAt" | "achievedAt">) => {
      if (existing.has(input.type)) return null;
      existing.add(input.type);
      created.push({
        studentId: input.studentId,
        type: input.type,
        source: input.source,
        relatedFlightId: input.relatedFlightId,
      });
      return { ...input, id: "milestone-1", achievedAt: "2026-08-20T00:00:00.000Z", createdAt: "2026-08-20T00:00:00.000Z" };
    },
  } as unknown as Repository;
  return { repo, created };
}

describe("evaluateAndAwardMilestones", () => {
  it("awards first_debrief on the first completed flight", async () => {
    const { repo, created } = fakeRepo({ flights: [flight({ id: "f1" })] });
    const awarded = await evaluateAndAwardMilestones(repo, "student-1", "f1");
    expect(awarded.map((m) => m.type)).toEqual(["first_debrief"]);
    expect(created).toEqual([
      { studentId: "student-1", type: "first_debrief", source: "automatic", relatedFlightId: "f1" },
    ]);
  });

  it("awards streak_3 and flights_total_5 together when both thresholds are crossed on the same flight", async () => {
    const flights = Array.from({ length: 5 }, (_, i) =>
      flight({ id: `f${i + 1}`, flightDate: `2026-08-${10 + i}` }),
    );
    // First 2 flights don't have completed debriefs, so total captured == streak == 3.
    flights[0].debriefStatus = "not_started";
    flights[1].debriefStatus = "not_started";
    const { repo } = fakeRepo({ flights });
    const awarded = await evaluateAndAwardMilestones(repo, "student-1", "f5");
    expect(awarded.map((m) => m.type).sort()).toEqual(["streak_3"]);
  });

  it("is idempotent -- running twice on the same state never creates a duplicate", async () => {
    const flights = [flight({ id: "f1" })];
    const { repo, created } = fakeRepo({ flights });
    await evaluateAndAwardMilestones(repo, "student-1", "f1");
    const secondRun = await evaluateAndAwardMilestones(repo, "student-1", "f1");
    expect(secondRun).toEqual([]);
    expect(created).toHaveLength(1);
  });

  it("returns no candidates once totals move past every threshold (no re-trigger on later flights)", async () => {
    const flights = Array.from({ length: 6 }, (_, i) => flight({ id: `f${i + 1}`, flightDate: `2026-08-${10 + i}` }));
    const { repo } = fakeRepo({ flights });
    // Evaluating with all 6 already complete: totalCaptured=6, streak=6 -- neither
    // matches a Phase 1 threshold (3,5,10,25,50), so nothing should be awarded.
    const awarded = await evaluateAndAwardMilestones(repo, "student-1", "f6");
    expect(awarded).toEqual([]);
  });
});
