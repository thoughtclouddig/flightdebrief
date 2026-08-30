import { describe, expect, it } from "vitest";
import { effectiveRetentionDays, isTranscriptExpired, DEFAULT_TRANSCRIPT_RETENTION_DAYS } from "./consent";

describe("effectiveRetentionDays", () => {
  it("falls back to the product default when an org has never set one", () => {
    expect(effectiveRetentionDays(undefined)).toBe(DEFAULT_TRANSCRIPT_RETENTION_DAYS);
  });

  // null is a deliberate choice ("keep indefinitely"), not a missing value --
  // collapsing the two would silently start deleting a school's records.
  it("treats an explicit null as keep-indefinitely, not as unset", () => {
    expect(effectiveRetentionDays(null)).toBeNull();
  });

  it("honors an org override", () => {
    expect(effectiveRetentionDays(90)).toBe(90);
  });
});

describe("isTranscriptExpired", () => {
  const now = new Date("2026-08-30T00:00:00Z");

  it("expires a transcript past the window", () => {
    expect(isTranscriptExpired(new Date("2025-01-01T00:00:00Z"), 365, now)).toBe(true);
  });

  it("keeps one inside the window", () => {
    expect(isTranscriptExpired(new Date("2026-08-01T00:00:00Z"), 365, now)).toBe(false);
  });

  it("never expires anything when retention is indefinite", () => {
    expect(isTranscriptExpired(new Date("2010-01-01T00:00:00Z"), null, now)).toBe(false);
  });
});
