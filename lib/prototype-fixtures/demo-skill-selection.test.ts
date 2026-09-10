import { beforeEach, describe, expect, it } from "vitest";
import { saveDemoSkillSelection, readDemoSkillSelection } from "./demo-skill-selection";

const STORAGE_KEY = "afterflight-demo-skill-selection";

/** vitest's default environment has no browser globals -- a small in-memory stand-in is enough to exercise the real read/write logic. */
function mockSessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("demo skill selection hand-off", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "sessionStorage", { value: mockSessionStorage(), configurable: true });
  });

  it("round-trips a real selection", () => {
    saveDemoSkillSelection([
      { taskCode: "CROSSWIND_LANDING", label: "Crosswind landings" },
      { taskCode: "SHORT_FIELD_LANDING", label: "Short-field landings" },
    ]);

    expect(readDemoSkillSelection()).toEqual([
      { taskCode: "CROSSWIND_LANDING", label: "Crosswind landings" },
      { taskCode: "SHORT_FIELD_LANDING", label: "Short-field landings" },
    ]);
  });

  it("returns empty when nothing has been saved yet -- callers fall back to their own fixture default", () => {
    expect(readDemoSkillSelection()).toEqual([]);
  });

  it("falls back to empty on malformed JSON rather than throwing", () => {
    sessionStorage.setItem(STORAGE_KEY, "{not valid json");

    expect(readDemoSkillSelection()).toEqual([]);
  });

  it("drops malformed entries from an otherwise-valid array instead of failing the whole read", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ taskCode: "OK", label: "Fine" }, { taskCode: 5, label: "Bad code" }, "not an object", null]),
    );

    expect(readDemoSkillSelection()).toEqual([{ taskCode: "OK", label: "Fine" }]);
  });

  it("never throws when sessionStorage itself is unavailable (e.g. privacy mode)", () => {
    Object.defineProperty(globalThis, "sessionStorage", { value: undefined, configurable: true });

    expect(() => saveDemoSkillSelection([{ taskCode: "X", label: "Y" }])).not.toThrow();
    expect(readDemoSkillSelection()).toEqual([]);
  });
});
