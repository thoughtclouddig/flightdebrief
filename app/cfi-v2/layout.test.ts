import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * CfiV2Layout is an async Server Component coupled to real viewer/session
 * access -- too heavy to render in a unit test, matching this repo's
 * established pattern for this shape of file (see e.g. app/(product)/
 * flights/[id]/debrief/page.test.ts). Static-source proof that the
 * Development-only rollout gate is gone -- CFI V2 is now released in every
 * environment -- while the real instructor-role auth check remains intact.
 */
const SOURCE = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

describe("CFI V2 layout — released in every environment, not gated on APP_ENV", () => {
  it("no longer imports or calls isDevelopment", () => {
    expect(SOURCE).not.toMatch(/isDevelopment/);
    expect(SOURCE).not.toMatch(/from "@\/lib\/env"/);
  });

  it("does not reject a request based on environment before checking the session", () => {
    expect(SOURCE).not.toMatch(/if\s*\(!isDevelopment\(\)\)\s*notFound\(\)/);
  });
});

describe("CFI V2 layout — auth/role enforcement is unchanged", () => {
  it("still requires a real signed-in session, redirecting to /login when absent", () => {
    expect(SOURCE).toMatch(/getViewer\(\)/);
    expect(SOURCE).toMatch(/redirect\("\/login\?from=%2Fcfi-v2&reason=no-session"\)/);
  });

  it("still requires the instructor role specifically", () => {
    expect(SOURCE).toMatch(/if\s*\(viewer\.role !== "instructor"\)\s*notFound\(\)/);
  });

  it("the role check still runs after a real session is established, not before", () => {
    const viewerIndex = SOURCE.indexOf("viewer = await getViewer()");
    const roleCheckIndex = SOURCE.indexOf('viewer.role !== "instructor"');
    expect(viewerIndex).toBeGreaterThan(-1);
    expect(roleCheckIndex).toBeGreaterThan(viewerIndex);
  });
});
