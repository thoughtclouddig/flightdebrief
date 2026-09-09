import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * SignupRolePickerPage is a plain static component -- its ROLES array is a
 * literal, not derived data, so a source check on that literal is a
 * complete test here, not a shortcut around something more meaningful to
 * assert. Guards against "Fly solo" acquisition wording (the exact framing
 * this copy was corrected away from -- "Solo" has a precise aviation
 * meaning distinct from "no linked instructor account," see
 * app/(product)/flights/new/student-new-flight-client.tsx's own guest-CFI
 * fix) silently creeping back into student acquisition copy.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Signup role picker — student copy never reintroduces 'Fly solo' framing", () => {
  it("the student-pilot card uses the approved instructor-inclusive copy", () => {
    expect(SOURCE).toContain("Use AfterFlight with any instructor — they don't need an account.");
  });

  it("never says 'Fly solo' anywhere on this page", () => {
    expect(SOURCE).not.toMatch(/Fly solo/i);
  });

  it("never frames Solo vs. joining-through-invite as the two acquisition paths", () => {
    expect(SOURCE).not.toMatch(/join through your CFI or flight school's invite/i);
  });
});
