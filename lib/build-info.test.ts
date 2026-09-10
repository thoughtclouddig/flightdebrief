import { describe, expect, it, vi } from "vitest";
import { getAppEnv } from "./env";
import { resolveBuildBadge } from "./build-info";

vi.mock("./env", () => ({ getAppEnv: vi.fn() }));
vi.mock("./build-info.generated", () => ({ BUILD_SHA: "abc123def" }));

describe("resolveBuildBadge", () => {
  it("Development: labels the badge DEV and includes the build SHA", () => {
    vi.mocked(getAppEnv).mockReturnValue("development");

    expect(resolveBuildBadge()).toEqual({ label: "DEV", sha: "abc123def" });
  });

  it("Staging: labels the badge STAGING and includes the build SHA", () => {
    vi.mocked(getAppEnv).mockReturnValue("staging");

    expect(resolveBuildBadge()).toEqual({ label: "STAGING", sha: "abc123def" });
  });

  it("Production: returns null -- no badge is ever shown to end users", () => {
    vi.mocked(getAppEnv).mockReturnValue("production");

    expect(resolveBuildBadge()).toBeNull();
  });
});
