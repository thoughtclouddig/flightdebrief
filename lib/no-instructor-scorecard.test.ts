import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Structural guard for the one product rule that is easy to break by
 * accident and expensive to break in the market.
 *
 * training_signals carries instructor_id on every row, which is what makes
 * "this weakness has come up in 4 lessons with 2 instructors" computable.
 * The same column also makes a per-CFI scorecard a one-line query away --
 * and a CFI who believes the tool grades them stops recording debriefs,
 * which ends the capture the entire product depends on. FlightSense already
 * sells instructor-effectiveness analytics; AfterFlight deliberately does
 * not, and that decision has until now been enforced only by comments.
 *
 * So: the unit of analysis is the SKILL. Instructor identity may be used to
 * COUNT DISTINCT instructors and to label a lesson in a timeline. It may not
 * be used as a grouping key for aggregation, and no type may expose a
 * per-instructor breakdown.
 *
 * If a future feature genuinely needs an exception, add an explicit
 * `// eslint-disable-next-line` style marker below and say why in the diff.
 * The point is that it should be a decision, not a slip.
 */

const ROOTS = ["lib", "app", "components"];
const SELF = "lib/no-instructor-scorecard.test.ts";
/** Opt-out marker for a reviewed, deliberate exception. */
const ALLOW = "afterflight-allow-instructor-aggregation";

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap((r) => sourceFiles(r))
  .map((f) => relative(process.cwd(), f))
  .filter((f) => f !== SELF);

describe("no instructor scorecard", () => {
  it("never groups training signals by instructor in SQL", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (src.includes(ALLOW)) continue;
      if (!src.includes("training_signals")) continue;
      // Any GROUP BY whose key list mentions instructor_id.
      const groupBys = src.match(/GROUP\s+BY[^;`)]*/gi) ?? [];
      if (groupBys.some((g) => /instructor_id/i.test(g))) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("does not expose a per-instructor breakdown on the recurrence type", () => {
    const src = readFileSync("lib/training-memory.ts", "utf8");
    const theme = src.slice(src.indexOf("export interface RecurringTheme"), src.indexOf("export interface NextLessonBrief"));
    // A count is fine -- it is the claim. A collection keyed by instructor is
    // a scorecard in waiting, whatever it gets named.
    expect(theme).toContain("instructorCount: number");
    expect(theme).not.toMatch(/byInstructor|perInstructor|instructorBreakdown|instructorStats|instructorScores/);
  });

  it("keeps instructor identity out of aggregate keys in the analysis layer", () => {
    const analysisFiles = files.filter(
      (f) => f.startsWith("lib/training-") || f.startsWith("lib/skill-progress") || f.startsWith("lib/debrief-cards/"),
    );
    const offenders: string[] = [];
    for (const file of analysisFiles) {
      const src = readFileSync(file, "utf8");
      if (src.includes(ALLOW)) continue;
      // Maps/records keyed by an instructor id are the shape a scorecard
      // takes before anyone calls it one. `instructorNamesById` is a lookup
      // table for labels, not an aggregate, so it is named explicitly here.
      const keyed =
        /new Map<string,[^>]*>\(\)\s*;?\s*\/\/\s*by instructor/i.test(src) ||
        /(bySchoolInstructor|byInstructor|perInstructor|instructorTotals|instructorCounts)\b/.test(src);
      if (keyed) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("has no route or component named for instructor performance", () => {
    const named = files.filter((f) =>
      /(instructor|cfi)[-_]?(scorecard|performance|effectiveness|ranking|leaderboard|quality)/i.test(f),
    );
    expect(named).toEqual([]);
  });
});
