import { describe, expect, it } from "vitest";
import { resolveDemoRedirectPath } from "./demo-redirect";

describe("resolveDemoRedirectPath — CFI V2 and School V2 are released, not environment-gated", () => {
  it("sends persona=cfi to /cfi-v2 -- the approved, released CFI experience", () => {
    expect(resolveDemoRedirectPath({ persona: "cfi", seedRedirectPath: "/cfi/today" })).toBe("/cfi-v2");
  });

  it("sends persona=cfi-v2 (the legacy alias) to /cfi-v2 too", () => {
    expect(resolveDemoRedirectPath({ persona: "cfi-v2", seedRedirectPath: "/cfi/today" })).toBe("/cfi-v2");
  });

  it("sends persona=school to /school-v2 -- the approved, released School experience", () => {
    expect(resolveDemoRedirectPath({ persona: "school", seedRedirectPath: "/admin/overview" })).toBe("/school-v2");
  });

  it("sends persona=pilot-real to real-data /v2, unaffected by the CFI/School release", () => {
    expect(resolveDemoRedirectPath({ persona: "pilot-real", seedRedirectPath: "/home" })).toBe("/v2");
  });

  it("has no environment parameter at all -- structurally cannot vary the CFI/School redirect by environment", () => {
    // TypeScript already enforces this (isDev was removed from the options
    // type), but this locks the runtime behavior in too: passing an
    // isDev-shaped extra property has no effect, because the function never
    // reads one.
    const withStrayIsDev = resolveDemoRedirectPath({
      persona: "cfi",
      seedRedirectPath: "/cfi/today",
      // @ts-expect-error -- isDev no longer exists on the options type; kept to prove it's ignored if present at runtime.
      isDev: false,
    });
    expect(withStrayIsDev).toBe("/cfi-v2");
  });
});
