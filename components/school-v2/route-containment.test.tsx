import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchoolV2DataConsentScreen } from "./data-consent-screen";
import { SchoolV2InsightsScreen } from "./insights-screen";
import type { SchoolV2Insights } from "@/lib/school-v2/insights";

const SCHOOL_V2_DIR = join(import.meta.dirname);

function schoolV2ComponentFiles(): string[] {
  return readdirSync(SCHOOL_V2_DIR)
    .filter((f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.endsWith(".test.tsx") && !f.endsWith(".test.ts"))
    .map((f) => join(SCHOOL_V2_DIR, f));
}

/**
 * SCHOOL-V2-2's Aircraft and Settings screens have no <Link> at all -- every
 * interaction is a fetch() to an existing /api/admin/** route, never a page
 * navigation -- so there's nothing for react-dom/server to render that would
 * meaningfully exercise route containment (and both call useRouter(), which
 * throws outside an actual Next.js app-router tree). This asserts the same
 * property statically instead: no School V2 component file's source
 * contains a literal /admin or /cfi-v2 href, across every file in the
 * directory, not just the two in scope for this pass.
 */
describe("School V2 route containment (static)", () => {
  it("no component under components/school-v2/** hardcodes a link into /admin/** or /cfi-v2/**", () => {
    for (const file of schoolV2ComponentFiles()) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} should not link into /admin/**`).not.toMatch(/href=["'`]\/admin\//);
      expect(source, `${file} should not link into /cfi-v2/**`).not.toMatch(/href=["'`]\/cfi-v2\//);
    }
  });
});

const emptyInsights: SchoolV2Insights = {
  recurringPatterns: [],
  coverage: [],
  needsWork: [],
  continuity: [],
  studentsToWatch: [],
};

describe("SchoolV2InsightsScreen route containment (rendered)", () => {
  it("every href in a populated Insights page points inside /school-v2/**", () => {
    const data: SchoolV2Insights = {
      ...emptyInsights,
      recurringPatterns: [
        { skill: "CROSSWIND_LANDING", label: "Crosswind landings", studentCount: 1, instructorCount: 1, students: [{ id: "s1", name: "Ava Kimura", href: "/school-v2/students/s1" }] },
      ],
      continuity: [{ studentId: "s1", studentName: "Ava Kimura", priorInstructorName: "Avery Chen", currentInstructorName: "Devon Brooks", since: "2026-08-01T00:00:00.000Z", themeSummary: "Crosswind landings has come up in 3 lessons with 2 instructors." }],
      studentsToWatch: [{ studentId: "s1", studentName: "Ava Kimura", instructorName: "Devon Brooks", reason: "recurring_theme", statusLabel: "Recurring", detail: "Crosswind landings has come up in 3 lessons.", flightContext: null, href: "/school-v2/students/s1" }],
    };

    const markup = renderToStaticMarkup(<SchoolV2InsightsScreen data={data} />);
    const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href.startsWith("/school-v2/")).toBe(true);
  });
});

describe("SchoolV2DataConsentScreen route containment + truthfulness (rendered)", () => {
  it("only links to real, non-/admin destinations", () => {
    const markup = renderToStaticMarkup(<SchoolV2DataConsentScreen retentionDays={365} />);
    const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);

    expect(hrefs).toEqual(["/data-handling", "/privacy", "/terms"]);
  });

  it("never repeats canonical's false self-serve deletion claim", () => {
    const markup = renderToStaticMarkup(<SchoolV2DataConsentScreen retentionDays={365} />);

    expect(markup).not.toMatch(/administrator,?\s*at any time,?\s*for any debrief/i);
    expect(markup).not.toMatch(/self-serve control is coming/i);
  });

  it("truthfully states there's no self-serve deletion, without promising Support can do it", () => {
    const markup = renderToStaticMarkup(<SchoolV2DataConsentScreen retentionDays={365} />);

    expect(markup).toMatch(/self-service transcript deletion is not currently available/i);
    // Phrased as a question-routing statement ("contact Support"), never a promise Support performs the deletion.
    expect(markup).not.toMatch(/support (will|can) (delete|perform|process|handle)/i);
    expect(markup).not.toMatch(/available today/i);
  });

  it("never contains internal/backlog-sounding language on a customer-facing screen", () => {
    const markup = renderToStaticMarkup(<SchoolV2DataConsentScreen retentionDays={365} />);

    expect(markup).not.toMatch(/aren.t built yet/i);
    expect(markup).not.toMatch(/we.d rather say so/i);
    expect(markup).not.toMatch(/coming soon|on the roadmap/i);
  });

  it("never makes a legal claim about subpoenas or discoverability", () => {
    const markup = renderToStaticMarkup(<SchoolV2DataConsentScreen retentionDays={365} />);

    expect(markup).not.toMatch(/subpoena/i);
    expect(markup).toMatch(/does not store the original audio recording/i);
  });

  it("renders 'kept indefinitely' when the org has no retention limit, not a stale day count", () => {
    const markup = renderToStaticMarkup(<SchoolV2DataConsentScreen retentionDays={null} />);
    expect(markup).toMatch(/indefinitely/i);
    expect(markup).not.toMatch(/\d+ days/);
  });
});
