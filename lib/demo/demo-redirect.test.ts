import { describe, expect, it } from "vitest";
import { resolveDemoRedirectPath } from "./demo-redirect";

describe("resolveDemoRedirectPath", () => {
  describe("Development", () => {
    it("sends persona=school to /school-v2", () => {
      expect(resolveDemoRedirectPath({ persona: "school", isDev: true, seedRedirectPath: "/admin/overview" })).toBe("/school-v2");
    });

    it("still sends persona=cfi to /cfi-v2 -- unchanged by this fix", () => {
      expect(resolveDemoRedirectPath({ persona: "cfi", isDev: true, seedRedirectPath: "/cfi/today" })).toBe("/cfi-v2");
    });

    it("still sends persona=cfi-v2 to /cfi-v2 -- unchanged by this fix", () => {
      expect(resolveDemoRedirectPath({ persona: "cfi-v2", isDev: true, seedRedirectPath: "/cfi/today" })).toBe("/cfi-v2");
    });

    it("still sends persona=pilot-real to real-data /v2 -- unchanged by this fix", () => {
      expect(resolveDemoRedirectPath({ persona: "pilot-real", isDev: true, seedRedirectPath: "/home" })).toBe("/v2");
    });
  });

  describe("Staging/Production (isDev: false)", () => {
    it("sends persona=school to the seed's own canonical redirectPath, not /school-v2", () => {
      expect(resolveDemoRedirectPath({ persona: "school", isDev: false, seedRedirectPath: "/admin/overview" })).toBe("/admin/overview");
    });

    it("sends persona=cfi to the seed's own canonical redirectPath, not /cfi-v2", () => {
      expect(resolveDemoRedirectPath({ persona: "cfi", isDev: false, seedRedirectPath: "/cfi/today" })).toBe("/cfi/today");
    });
  });
});
