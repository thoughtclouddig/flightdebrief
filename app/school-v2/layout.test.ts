import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * SchoolV2Layout is an async Server Component coupled to real viewer/session
 * access -- same untestable-at-runtime shape as app/cfi-v2/layout.tsx, same
 * static-source proof pattern. Confirms the Development-only rollout gate
 * is gone -- School V2 is now released in every environment -- while the
 * real admin/superadmin auth check remains intact.
 */
const SOURCE = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

describe("School V2 layout — released in every environment, not gated on APP_ENV", () => {
  it("no longer imports or calls isDevelopment", () => {
    expect(SOURCE).not.toMatch(/isDevelopment/);
    expect(SOURCE).not.toMatch(/from "@\/lib\/env"/);
  });

  it("does not reject a request based on environment before checking the session", () => {
    expect(SOURCE).not.toMatch(/if\s*\(!isDevelopment\(\)\)\s*notFound\(\)/);
  });
});

describe("School V2 layout — auth/role enforcement is unchanged", () => {
  it("still requires a real signed-in session, redirecting to /login when absent", () => {
    expect(SOURCE).toMatch(/getViewer\(\)/);
    expect(SOURCE).toMatch(/redirect\("\/login\?from=%2Fschool-v2&reason=no-session"\)/);
  });

  it("still requires admin or the platform-level superadmin carve-out, matching canonical /admin/**", () => {
    expect(SOURCE).toMatch(/if\s*\(viewer\.role !== "admin" && !isSuperadmin\(viewer\.user\.email\)\)\s*notFound\(\)/);
  });

  it("the role check still runs after a real session is established, not before", () => {
    const viewerIndex = SOURCE.indexOf("viewer = await getViewer()");
    const roleCheckIndex = SOURCE.indexOf('viewer.role !== "admin"');
    expect(viewerIndex).toBeGreaterThan(-1);
    expect(roleCheckIndex).toBeGreaterThan(viewerIndex);
  });
});
