import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * "use client" component driven by state and fetch() -- too interaction-
 * coupled for a render test, matching this file's existing sibling test
 * (flight-search-copy.test.ts). Static source proof that the guest-CFI gap
 * is actually fixed: a student could previously only pick "No instructor"
 * or an already-linked account, which meant a real dual flight with an
 * unlinked CFI had no way to be represented as anything but Solo. Solo must
 * now be an explicit selection, and "with an instructor" must accept a
 * free-text name -- the backend (getOrCreateInstructor via app/api/flights/
 * route.ts) already supported this, only the UI didn't expose it.
 */
const SOURCE = readFileSync(new URL("./student-new-flight-client.tsx", import.meta.url), "utf8");

describe("Guest-CFI flight creation — Solo is an explicit choice, not a default", () => {
  it("defaults both forms' participation state to with_instructor, not solo", () => {
    const defaults = SOURCE.match(/useState<Participation>\("with_instructor"\)/g) ?? [];
    expect(defaults.length).toBe(2); // ConfirmCandidateForm and ManualForm
  });

  it("never defaults participation to solo", () => {
    expect(SOURCE).not.toMatch(/useState<Participation>\("solo"\)/);
  });

  it("presents Solo and With-instructor as a segmented, mutually exclusive choice", () => {
    expect(SOURCE).toMatch(/label: "Flew with an instructor"/);
    expect(SOURCE).toMatch(/label: "Flew solo"/);
  });
});

describe("Guest-CFI flight creation — a name is required, an account is not", () => {
  it("offers a free-text instructor-name option distinct from the linked-account list", () => {
    expect(SOURCE).toMatch(/Enter a name \(no account needed\)/);
  });

  it("both submit handlers block submission when 'with an instructor' has no name yet", () => {
    const guardCount = (
      SOURCE.match(/participation === "with_instructor" && !.*\.trim\(\)/g) ?? []
    ).length;
    expect(guardCount).toBe(2);
  });

  it("both submit handlers only send instructorName when participation is with_instructor", () => {
    const sendCount = (SOURCE.match(/participation === "with_instructor" \? (?:instructorName|form\.instructorName) : undefined/g) ?? []).length;
    expect(sendCount).toBe(2);
  });

  it("no longer infers has_instructor from the presence of a name string alone", () => {
    expect(SOURCE).not.toMatch(/has_instructor: Boolean\(/);
    const trackedAsParticipation = (SOURCE.match(/has_instructor: participation === "with_instructor"/g) ?? []).length;
    expect(trackedAsParticipation).toBe(2);
  });
});

describe("Guest-CFI flight creation — both entry points (search and manual) are fixed, not just one", () => {
  it("renders ParticipationField in place of a bare InstructorSelect in both forms", () => {
    const usages = SOURCE.match(/<ParticipationField/g) ?? [];
    expect(usages.length).toBe(2);
  });
});
