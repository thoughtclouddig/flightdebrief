import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * "use client" component driven by state and fetch() -- too interaction-
 * coupled for a render test, matching this file's existing sibling test
 * (flight-search-copy.test.ts). Static source proof of two related fixes:
 *
 * 1. The guest-CFI gap: a student could previously only pick "No
 *    instructor" or an already-linked account, which meant a real dual
 *    flight with an unlinked CFI had no way to be represented as anything
 *    but Solo. Solo must now be an explicit selection, and "with an
 *    instructor" must accept a name for someone with no account -- the
 *    backend (getOrCreateInstructor via app/api/flights/route.ts) already
 *    supported this, only the UI didn't expose it.
 *
 * 2. UX simplification: browser acceptance found the first fix for (1)
 *    over-exposed account/invite mechanics (a separate dropdown option
 *    plus a whole name/email invitation form) for what should just be
 *    "who was your instructor." The question is who flew with the
 *    student, not whether that person has an AfterFlight account -- so
 *    the UI is now a single selector with one "Someone else" option that
 *    swaps in a plain name field, and the account-invitation UI
 *    (/api/student/invite-cfi) is gone from this flow entirely (the API
 *    itself is untouched -- it can live elsewhere later).
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
  it("offers 'Someone else' as the only way to name an unlinked instructor, not a separate no-account dropdown entry", () => {
    expect(SOURCE).toMatch(/Someone else/);
    expect(SOURCE).not.toMatch(/Enter a name \(no account needed\)/);
  });

  it("replaces the selector with a plain name field rather than stacking both, and offers a way back", () => {
    expect(SOURCE).toMatch(/placeholder="Instructor's name"/);
    expect(SOURCE).toMatch(/Choose from your instructors instead/);
  });

  it("both submit handlers block submission when 'with an instructor' has no name yet", () => {
    const guardCount = (SOURCE.match(/participation === "with_instructor" && !.*\.trim\(\)/g) ?? []).length;
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

describe("Guest-CFI flight creation — account invitation removed from this flow", () => {
  it("no longer calls the CFI-invitation API from flight creation", () => {
    expect(SOURCE).not.toMatch(/fetch\(\s*["']\/api\/student\/invite-cfi["']/);
  });

  it("no longer renders an 'Add your CFI' control or an email field in this flow", () => {
    expect(SOURCE).not.toMatch(/Add your CFI/);
    expect(SOURCE).not.toMatch(/CFI's email/);
    expect(SOURCE).not.toMatch(/type="email"/);
  });

  it("dropped the now-unused allowInviteCfi prop entirely, rather than leaving it accepted-but-ignored", () => {
    expect(SOURCE).not.toMatch(/allowInviteCfi/);
  });
});

describe("Guest-CFI flight creation — both entry points (search and manual) are fixed, not just one", () => {
  it("renders ParticipationField in place of a bare InstructorSelect in both forms", () => {
    const usages = SOURCE.match(/<ParticipationField/g) ?? [];
    expect(usages.length).toBe(2);
  });
});
