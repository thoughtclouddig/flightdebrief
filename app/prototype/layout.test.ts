import { afterEach, describe, expect, it, vi } from "vitest";
import PrototypeLayout from "./layout";

// Calling the layout function directly (not through Next's router) is safe
// here because the guard throws before any child element is constructed, and
// JSX like <AppHeader /> below it only builds an element descriptor -- it
// never invokes AppHeader's own body, so its real session/DB dependencies are
// never reached.
const NOT_FOUND_DIGEST = /^NEXT_HTTP_ERROR_FALLBACK;404$/;

describe("PrototypeLayout environment guard (Staging-RC-0)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders in development", () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("REPLIT_DEPLOYMENT", "");

    const element = PrototypeLayout({ children: null });

    expect(element.type).toBe("div");
  });

  it("404s in staging", () => {
    vi.stubEnv("APP_ENV", "staging");

    expect(() => PrototypeLayout({ children: null })).toThrowError(
      expect.objectContaining({ digest: expect.stringMatching(NOT_FOUND_DIGEST) }),
    );
  });

  it("404s in production", () => {
    vi.stubEnv("APP_ENV", "production");

    expect(() => PrototypeLayout({ children: null })).toThrowError(
      expect.objectContaining({ digest: expect.stringMatching(NOT_FOUND_DIGEST) }),
    );
  });

  it("404s on a deployed runtime with no explicit APP_ENV (REPLIT_DEPLOYMENT fallback resolves to production)", () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("REPLIT_DEPLOYMENT", "1");

    expect(() => PrototypeLayout({ children: null })).toThrowError(
      expect.objectContaining({ digest: expect.stringMatching(NOT_FOUND_DIGEST) }),
    );
  });
});
