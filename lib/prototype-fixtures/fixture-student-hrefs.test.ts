import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { buildFixtureStudentHrefs } from "./fixture-student-hrefs";

const ROOT = path.resolve(import.meta.dirname, "../..");

describe("buildFixtureStudentHrefs", () => {
  it("prefixes every href with the given base and nothing else", () => {
    const v2 = buildFixtureStudentHrefs("/v2");
    expect(v2.home).toBe("/v2");
    expect(v2.flights).toBe("/v2/flights");
    expect(v2.flightDetail("abc")).toBe("/v2/flights/abc");
    expect(v2.flightAnalysis("abc")).toBe("/v2/flights/abc/analysis");
    expect(v2.flightCompare("abc")).toBe("/v2/flights/abc/compare");
    expect(v2.flightReplay("abc")).toBe("/v2/flights/abc/replay");
    expect(v2.flightReplay("abc", 42)).toBe("/v2/flights/abc/replay?t=42");
    expect(v2.flightMoment("abc", "m1")).toBe("/v2/flights/abc/moments/m1");
    expect(v2.flightMomentsBase("abc")).toBe("/v2/flights/abc/moments");
    expect(v2.fly).toBe("/v2/fly");
    expect(v2.train).toBe("/v2/train");
    expect(v2.chairFly).toBe("/v2/train/chair-fly");
    expect(v2.debriefHub).toBe("/v2/debrief");
    expect(v2.debriefNew).toBe("/v2/debrief/new");
    expect(v2.debriefLatest).toBe("/v2/debrief/latest");
    expect(v2.progress).toBe("/v2/progress");
    expect(v2.skill("crosswind-landing")).toBe("/v2/progress/crosswind-landing");
    expect(v2.profile).toBe("/v2/profile");
    expect(v2.profileGuide).toBe("/v2/profile/guide");
    expect(v2.profileSupport).toBe("/v2/profile/support");
  });

  it("never lets one namespace's hrefs contain the other namespace's base", () => {
    const v2 = buildFixtureStudentHrefs("/v2");
    const demo = buildFixtureStudentHrefs("/demo/student");
    const sampleV2 = [v2.home, v2.flights, v2.flightDetail("x"), v2.flightReplay("x", 1), v2.skill("y"), v2.profileSupport];
    const sampleDemo = [demo.home, demo.flights, demo.flightDetail("x"), demo.flightReplay("x", 1), demo.skill("y"), demo.profileSupport];
    for (const href of sampleV2) expect(href.startsWith("/demo/student")).toBe(false);
    for (const href of sampleDemo) expect(href.startsWith("/v2")).toBe(false);
  });

  it("produces the same route shape regardless of base", () => {
    const v2 = buildFixtureStudentHrefs("/v2");
    const demo = buildFixtureStudentHrefs("/demo/student");
    const stripBase = (href: string, base: string) => href.slice(base.length);
    expect(stripBase(demo.flights, "/demo/student")).toBe(stripBase(v2.flights, "/v2"));
    expect(stripBase(demo.flightDetail("x"), "/demo/student")).toBe(stripBase(v2.flightDetail("x"), "/v2"));
    expect(stripBase(demo.debriefLatest, "/demo/student")).toBe(stripBase(v2.debriefLatest, "/v2"));
    expect(stripBase(demo.skill("y"), "/demo/student")).toBe(stripBase(v2.skill("y"), "/v2"));
  });
});

/**
 * Route-inventory parity: the failure mode that let app/prototype/vector/**
 * silently drift from app/v2/** was two independently-maintained route trees
 * with no check tying their file sets together. This doesn't inspect
 * behavior -- it only asserts that every fixture route the approved Mia demo
 * needs under /v2 has a same-shaped file under /demo/student, so an route
 * added to one tree and forgotten in the other fails the suite immediately
 * instead of silently shipping a 404 or a missing screen.
 */
const FIXTURE_ROUTE_FILES = [
  "page.tsx",
  "train/page.tsx",
  "train/chair-fly/page.tsx",
  "debrief/page.tsx",
  "debrief/new/page.tsx",
  "debrief/latest/page.tsx",
  "progress/page.tsx",
  "progress/[skill]/page.tsx",
  "flights/page.tsx",
  "flights/new/page.tsx",
  "flights/[id]/page.tsx",
  "flights/[id]/analysis/page.tsx",
  "flights/[id]/compare/page.tsx",
  "flights/[id]/replay/page.tsx",
  "flights/[id]/moments/[moment]/page.tsx",
  "fly/page.tsx",
  "profile/page.tsx",
  "profile/guide/page.tsx",
  "profile/support/page.tsx",
];

describe("Mia fixture route inventory", () => {
  it.each(FIXTURE_ROUTE_FILES)("app/v2/%s has a app/demo/student/%s counterpart", (relativePath) => {
    const v2File = path.join(ROOT, "app", "v2", relativePath);
    const demoFile = path.join(ROOT, "app", "demo", "student", relativePath);
    expect(existsSync(v2File), `expected ${v2File} to exist`).toBe(true);
    expect(existsSync(demoFile), `expected ${demoFile} to exist -- app/v2/${relativePath} has no /demo/student counterpart`).toBe(true);
  });

  it("both layouts exist", () => {
    expect(existsSync(path.join(ROOT, "app", "v2", "layout.tsx"))).toBe(true);
    expect(existsSync(path.join(ROOT, "app", "demo", "student", "layout.tsx"))).toBe(true);
  });
});
