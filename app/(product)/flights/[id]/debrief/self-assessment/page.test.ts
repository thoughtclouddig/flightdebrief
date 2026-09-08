import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Same DB-coupled-async-Server-Component situation as the resolver's own test -- static proof, not a render. */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Self-assessment page — solo never sees a CFI handoff", () => {
  it("redirects a solo submission (no flight.instructor) back to the resolver instead of rendering the handoff screen", () => {
    expect(SOURCE).toMatch(/if\s*\(!flight\.instructor\)\s*\{\s*\n\s*redirect\(`\/flights\/\$\{id\}\/debrief`\)/);
  });

  it("the handoff-screen render is reached only after the solo redirect, never unconditionally", () => {
    const redirectIndex = SOURCE.indexOf("if (!flight.instructor)");
    const handoffIndex = SOURCE.indexOf("<HandoffScreen");
    expect(redirectIndex).toBeGreaterThan(-1);
    expect(handoffIndex).toBeGreaterThan(redirectIndex);
  });
});
