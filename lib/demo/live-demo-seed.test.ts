import { describe, expect, it } from "vitest";
import { demoHistoryWindow, SCHOOL_V2_STUDENTS } from "./live-demo-seed";
import { DEMO_HISTORY } from "./video-demo-data";

describe("demoHistoryWindow", () => {
  it("defaults to the array's tail when historyEndIndex is undefined -- unchanged behavior for every CFI_V2_STUDENTS entry", () => {
    expect(demoHistoryWindow(4, undefined, 9)).toEqual({ start: 5, end: 8 });
    expect(demoHistoryWindow(1, undefined, 9)).toEqual({ start: 8, end: 8 });
  });

  it("honors an explicit historyEndIndex within range", () => {
    expect(demoHistoryWindow(3, 4, 9)).toEqual({ start: 2, end: 4 });
    expect(demoHistoryWindow(1, 0, 9)).toEqual({ start: 0, end: 0 });
  });

  it("clamps an historyEndIndex that would need more entries than exist before it", () => {
    // flights=8 needs 8 consecutive entries; end=3 can't fit (only 4 entries exist at indices 0..3) -- clamps end up to 7.
    expect(demoHistoryWindow(8, 3, 9)).toEqual({ start: 0, end: 7 });
  });

  it("clamps an historyEndIndex past the end of the array", () => {
    expect(demoHistoryWindow(3, 99, 9)).toEqual({ start: 6, end: 8 });
  });

  it("never returns a negative start, even for an extreme mismatch", () => {
    const { start } = demoHistoryWindow(9, 0, 9);
    expect(start).toBeGreaterThanOrEqual(0);
  });
});

describe("SCHOOL_V2_STUDENTS roster shape", () => {
  it("keeps 24 students", () => {
    expect(SCHOOL_V2_STUDENTS).toHaveLength(24);
  });

  it("keeps the 5/5/6/4/4 current-instructor distribution", () => {
    const counts = new Map<number, number>();
    for (const s of SCHOOL_V2_STUDENTS) counts.set(s.instructorIndex, (counts.get(s.instructorIndex) ?? 0) + 1);
    expect([...counts.entries()].sort((a, b) => a[0] - b[0]).map(([, count]) => count)).toEqual([5, 5, 6, 4, 4]);
  });

  it("keeps exactly 3 handoff pairs", () => {
    const handoffs = SCHOOL_V2_STUDENTS.filter((s) => s.priorInstructorIndex !== undefined && s.handoffAt !== undefined);
    expect(handoffs.map((s) => s.name)).toEqual(["Casey Learner", "Ava Kimura", "Amara Okafor"]);
  });

  it("keeps at least 2 recurring-weakness students, specifically Marcus Webb and Ava Kimura", () => {
    const recurring = SCHOOL_V2_STUDENTS.filter((s) => s.recurringWeakness);
    expect(recurring.length).toBeGreaterThanOrEqual(2);
    expect(recurring.map((s) => s.name)).toEqual(expect.arrayContaining(["Marcus Webb", "Ava Kimura"]));
  });

  it("leaves the 4 protected story students (2 recurring-weakness + Casey + Amara) at the default history window", () => {
    const protectedNames = new Set(["Marcus Webb", "Ava Kimura", "Casey Learner", "Amara Okafor"]);
    for (const s of SCHOOL_V2_STUDENTS) {
      if (protectedNames.has(s.name)) expect(s.historyEndIndex).toBeUndefined();
    }
  });

  it("does NOT give all 24 students the same most-recent history entry -- the SCHOOL-V2-2 correction's actual point", () => {
    const endIndexes = SCHOOL_V2_STUDENTS.map((s) => demoHistoryWindow(s.flights, s.historyEndIndex, DEMO_HISTORY.length).end);
    const distinctValues = new Set(endIndexes);

    expect(distinctValues.size).toBeGreaterThanOrEqual(5);
    // The shared final entry (a real, legitimate pattern) should be a subset, not the whole roster.
    const sharedEndingCount = endIndexes.filter((end) => end === DEMO_HISTORY.length - 1).length;
    expect(sharedEndingCount).toBeLessThan(SCHOOL_V2_STUDENTS.length / 2);
  });

  it("current skill-state SOURCE (the actual final transcript) differs across multiple students, not just the index", () => {
    const finalTranscripts = new Set(
      SCHOOL_V2_STUDENTS.map((s) => {
        const { end } = demoHistoryWindow(s.flights, s.historyEndIndex, DEMO_HISTORY.length);
        return DEMO_HISTORY[end]!.transcript;
      }),
    );
    expect(finalTranscripts.size).toBeGreaterThanOrEqual(5);
  });

  it("keeps every window in bounds for DEMO_HISTORY's actual current length", () => {
    for (const s of SCHOOL_V2_STUDENTS) {
      const { start, end } = demoHistoryWindow(s.flights, s.historyEndIndex, DEMO_HISTORY.length);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeLessThanOrEqual(DEMO_HISTORY.length - 1);
      expect(end - start + 1).toBe(Math.min(s.flights, DEMO_HISTORY.length));
    }
  });
});
