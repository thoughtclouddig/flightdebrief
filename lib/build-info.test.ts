import { describe, expect, it, vi } from "vitest";
import { getAppEnv } from "./env";
import { resolveEnvironmentBanner, resolveTitlePrefix } from "./build-info";

vi.mock("./env", () => ({ getAppEnv: vi.fn() }));
vi.mock("./build-info.generated", () => ({ BUILD_SHA: "abc123def" }));

describe("resolveEnvironmentBanner", () => {
  it("Development: labels the banner DEVELOPMENT and includes the build SHA", () => {
    vi.mocked(getAppEnv).mockReturnValue("development");

    expect(resolveEnvironmentBanner()).toEqual({ label: "DEVELOPMENT", sha: "abc123def" });
  });

  it("Staging: labels the banner STAGING and includes the build SHA", () => {
    vi.mocked(getAppEnv).mockReturnValue("staging");

    expect(resolveEnvironmentBanner()).toEqual({ label: "STAGING", sha: "abc123def" });
  });

  it("Production: returns null -- no banner is ever shown to end users", () => {
    vi.mocked(getAppEnv).mockReturnValue("production");

    expect(resolveEnvironmentBanner()).toBeNull();
  });
});

describe("resolveTitlePrefix -- app/layout.tsx's browser-tab prefix", () => {
  it("Development: prefixes the title with [DEV]", () => {
    vi.mocked(getAppEnv).mockReturnValue("development");

    expect(resolveTitlePrefix()).toBe("[DEV] ");
  });

  it("Staging: prefixes the title with [STAGING]", () => {
    vi.mocked(getAppEnv).mockReturnValue("staging");

    expect(resolveTitlePrefix()).toBe("[STAGING] ");
  });

  it("Production: no prefix -- the browser tab reads exactly 'AfterFlight'", () => {
    vi.mocked(getAppEnv).mockReturnValue("production");

    expect(resolveTitlePrefix()).toBe("");
  });
});
