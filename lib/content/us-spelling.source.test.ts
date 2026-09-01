import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * American English, enforced over the repository itself.
 *
 * us-spelling.ts already fixed GENERATED articles and fix-british-spellings.mjs
 * already fixed STORED ones -- but neither ever looked at the source tree, so
 * every hand-written UI string, JSX label and comment was uncovered. That is
 * exactly where the British forms kept coming back: "organised" shipped in a
 * caption on the Progress screen and "manoeuvre" in a chair-fly response.
 *
 * This test closes it. It runs in the normal suite, so the next time a British
 * spelling lands anywhere in app/, lib/, components/, scripts/ or the docs,
 * `npm test` fails and names the file.
 *
 *   node scripts/fix-source-spellings.mjs --write
 *
 * fixes everything it finds.
 */
const require_ = createRequire(import.meta.url);
const sweeper = require_("../../scripts/fix-source-spellings.mjs") as {
  PATTERN: RegExp;
  sourceFiles: () => string[];
  PROTECTED: Record<string, string>;
};

describe("American English", () => {
  it("is used everywhere in the source tree", () => {
    const offenders: string[] = [];
    for (const file of sweeper.sourceFiles()) {
      const found = readFileSync(file, "utf8").match(new RegExp(sweeper.PATTERN.source, "gi"));
      if (found) offenders.push(`${file}: ${[...new Set(found)].join(", ")}`);
    }
    expect(
      offenders,
      `British spellings found. Run: node scripts/fix-source-spellings.mjs --write\n\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("documents every spelling it deliberately leaves alone", () => {
    // Both exceptions are spellings this codebase does not own. If either list
    // grows, the reason has to be written down next to it.
    for (const reason of Object.values(sweeper.PROTECTED)) expect(reason.length).toBeGreaterThan(10);
    expect(Object.keys(sweeper.PROTECTED).map((w) => w.toLowerCase())).toContain("analyser");
    expect(Object.keys(sweeper.PROTECTED).map((w) => w.toLowerCase())).toContain("cancelled");
  });
});
