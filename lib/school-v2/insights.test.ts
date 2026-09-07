import { describe, expect, it } from "vitest";
import { aggregateRecurringPatterns, selectStudentsToWatch } from "./insights";
import type { SchoolAttentionItem } from "./overview";
import type { SchoolV2RosterEntry } from "./roster";
import type { RecurringStudentIssue } from "@/lib/training-insights";
import type { User } from "@/lib/types";

function attentionItem(overrides: Partial<SchoolAttentionItem> & { reason: SchoolAttentionItem["reason"] }): SchoolAttentionItem {
  return {
    studentId: "s1",
    studentName: "Student",
    instructorName: "Instructor",
    statusLabel: "Label",
    detail: "Detail",
    flightContext: null,
    href: "/school-v2/students/s1",
    ...overrides,
  };
}

function user(id: string, name: string): User {
  return { id, name, email: `${id}@example.com`, authUserId: `${id}@example.com`, avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" };
}

function rosterEntry(id: string, name: string, instructorId: string, instructorName: string): SchoolV2RosterEntry {
  return {
    student: user(id, name),
    status: "active",
    isPrimary: true,
    mostRecentFlight: null,
    pendingFlight: null,
    lastDebriefStatus: null,
    nextReservation: null,
    currentFocus: [],
    hasNextLessonItems: true,
    topRecurringTheme: null,
    primaryInstructorId: instructorId,
    primaryInstructorName: instructorName,
  };
}

function issue(overrides: Partial<RecurringStudentIssue> & { studentId: string; studentName: string }): RecurringStudentIssue {
  const { studentId, studentName, ...rest } = overrides;
  return {
    student: user(studentId, studentName),
    skill: "CROSSWIND_LANDING",
    label: "Crosswind landings",
    count: 3,
    consideredFlights: 4,
    ...rest,
  };
}

describe("aggregateRecurringPatterns", () => {
  it("groups issues by skill and counts distinct affected students", () => {
    const roster = [
      rosterEntry("s1", "Marcus Webb", "i1", "Avery Chen"),
      rosterEntry("s2", "Ava Kimura", "i2", "Devon Brooks"),
    ];
    const issues = [
      issue({ studentId: "s1", studentName: "Marcus Webb" }),
      issue({ studentId: "s2", studentName: "Ava Kimura" }),
    ];

    const result = aggregateRecurringPatterns(issues, roster);

    expect(result).toHaveLength(1);
    expect(result[0]!.skill).toBe("CROSSWIND_LANDING");
    expect(result[0]!.studentCount).toBe(2);
  });

  it("counts DISTINCT current instructors, not one per student", () => {
    const roster = [
      rosterEntry("s1", "Marcus Webb", "i1", "Avery Chen"),
      rosterEntry("s2", "Ava Kimura", "i1", "Avery Chen"), // same current instructor as s1
      rosterEntry("s3", "Dana Osei", "i2", "Devon Brooks"),
    ];
    const issues = [
      issue({ studentId: "s1", studentName: "Marcus Webb" }),
      issue({ studentId: "s2", studentName: "Ava Kimura" }),
      issue({ studentId: "s3", studentName: "Dana Osei" }),
    ];

    const result = aggregateRecurringPatterns(issues, roster);

    expect(result[0]!.studentCount).toBe(3);
    expect(result[0]!.instructorCount).toBe(2); // Avery Chen + Devon Brooks, not 3
  });

  it("still counts a student toward studentCount even if they're not in the active roster (e.g. inactive), but doesn't attribute a phantom instructor", () => {
    const roster: SchoolV2RosterEntry[] = []; // student not found in roster
    const issues = [issue({ studentId: "s1", studentName: "Former Student" })];

    const result = aggregateRecurringPatterns(issues, roster);

    expect(result[0]!.studentCount).toBe(1);
    expect(result[0]!.instructorCount).toBe(0);
  });

  it("sorts affected students alphabetically and produces a real drill-down href", () => {
    const roster = [rosterEntry("s1", "Zoe Adler", "i1", "Avery Chen"), rosterEntry("s2", "Amy Baker", "i1", "Avery Chen")];
    const issues = [issue({ studentId: "s1", studentName: "Zoe Adler" }), issue({ studentId: "s2", studentName: "Amy Baker" })];

    const result = aggregateRecurringPatterns(issues, roster);

    expect(result[0]!.students.map((s) => s.name)).toEqual(["Amy Baker", "Zoe Adler"]);
    expect(result[0]!.students[0]!.href).toBe("/school-v2/students/s2");
  });

  it("sorts patterns by studentCount descending", () => {
    const roster = [
      rosterEntry("s1", "A", "i1", "X"),
      rosterEntry("s2", "B", "i1", "X"),
      rosterEntry("s3", "C", "i1", "X"),
    ];
    const issues = [
      issue({ studentId: "s1", studentName: "A", skill: "RADIO_COMMUNICATIONS", label: "Radio communications" }),
      issue({ studentId: "s2", studentName: "B", skill: "RADIO_COMMUNICATIONS", label: "Radio communications" }),
      issue({ studentId: "s3", studentName: "C", skill: "STEEP_TURNS", label: "Steep turns" }),
    ];

    const result = aggregateRecurringPatterns(issues, roster);

    expect(result.map((r) => r.skill)).toEqual(["RADIO_COMMUNICATIONS", "STEEP_TURNS"]);
  });

  it("never introduces a score, rank, or grade field", () => {
    const roster = [rosterEntry("s1", "Marcus Webb", "i1", "Avery Chen")];
    const issues = [issue({ studentId: "s1", studentName: "Marcus Webb" })];

    const result = aggregateRecurringPatterns(issues, roster);

    const keys = Object.keys(result[0]!);
    expect(keys.some((k) => /score|rank|grade|performance/i.test(k))).toBe(false);
  });
});

describe("selectStudentsToWatch", () => {
  it("keeps recurring_theme -- the only reason that describes an actual training pattern", () => {
    const items = [attentionItem({ reason: "recurring_theme" })];
    expect(selectStudentsToWatch(items)).toHaveLength(1);
  });

  it("excludes a bare stale_gap -- an attendance fact Overview already owns, not a pattern", () => {
    const items = [attentionItem({ reason: "stale_gap" })];
    expect(selectStudentsToWatch(items)).toEqual([]);
  });

  it("excludes bare debrief-lifecycle workflow reasons that Overview already owns", () => {
    const items = [attentionItem({ reason: "unresolved_debrief" }), attentionItem({ reason: "no_objectives_yet" })];
    expect(selectStudentsToWatch(items)).toEqual([]);
  });

  it("keeps only recurring_theme out of a mixed list, dropping stale_gap alongside the workflow reasons", () => {
    const items = [
      attentionItem({ studentId: "s1", reason: "unresolved_debrief" }),
      attentionItem({ studentId: "s2", reason: "recurring_theme" }),
      attentionItem({ studentId: "s3", reason: "no_objectives_yet" }),
      attentionItem({ studentId: "s4", reason: "stale_gap" }),
    ];
    expect(selectStudentsToWatch(items).map((i) => i.studentId)).toEqual(["s2"]);
  });
});
