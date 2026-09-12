import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * RadioPracticePicker calls useRouter(), which throws outside an actual
 * Next.js app-router tree (same constraint documented in
 * components/school-v2/route-containment.test.tsx and
 * components/resume-debrief-button.tsx's own test gap) -- static-source
 * proof instead of a render test.
 *
 * The point of this test: the backend still models this as a
 * RadioPracticeAssignment with assignedBy: null (see
 * app/api/radio-practice/assign/route.ts), but that framing must never
 * reach the student. The UI says "start"/"practice," never "assign."
 */
const SOURCE = readFileSync(new URL("./radio-practice-picker.tsx", import.meta.url), "utf8");

describe("RadioPracticePicker — student-facing copy says Start, never Assign", () => {
  it("never uses assign/assignment language in the page title, kicker, or intro copy", () => {
    expect(SOURCE).toMatch(/kicker="Practice with Vector"/);
    expect(SOURCE).toMatch(/<PageTitle kicker="Practice with Vector">Radio Practice<\/PageTitle>/);
    const introMatch = SOURCE.match(/<p className="px-1\.5[^>]*">\s*([\s\S]*?)\s*<\/p>/);
    expect(introMatch).not.toBeNull();
    expect(introMatch![1].toLowerCase()).not.toMatch(/assign/);
  });

  it("posts through the existing /api/radio-practice/assign endpoint -- one engine, not a second system", () => {
    expect(SOURCE).toContain('fetch("/api/radio-practice/assign"');
  });

  it("navigates into the real practice session once started", () => {
    expect(SOURCE).toMatch(/router\.push\(`\/practice\/\$\{data\.assignment\.id\}`\)/);
  });
});
