import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * CfiV2AddFlightPage is an async Server Component coupled to real
 * repository/auth access -- too heavy to render in a unit test, same
 * reasoning app/(product)/flights/[id]/debrief/page.test.ts already
 * documents for a page this shape. This is a static-source proof that the
 * route's studentId param actually reaches the client component (the
 * "selected student survives into CFI V2 Add Flight" contract) and that the
 * authorization check wasn't dropped in the process.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("CFI V2 Add Flight page — selected student survives the navigation", () => {
  it("resolves the student from the route's own [id] param, not a fixed/default value", () => {
    expect(SOURCE).toMatch(/const \{ id: studentId \} = await params/);
  });

  it("passes that exact studentId into the client component", () => {
    expect(SOURCE).toMatch(/<CfiV2AddFlightClient\s+studentId=\{studentId\}/);
  });

  it("still authorizes the student against the viewer's own organization before rendering anything", () => {
    expect(SOURCE).toMatch(/memberships\.some\(\(m\) => m\.organizationId === viewer\.organization\.id\)/);
    expect(SOURCE).toMatch(/notFound\(\)/);
  });

  it("the back link returns to this same student's CFI V2 record, not the roster or a legacy page", () => {
    expect(SOURCE).toMatch(/<BackLink href=\{`\/cfi-v2\/students\/\$\{studentId\}`\}>/);
  });
});
