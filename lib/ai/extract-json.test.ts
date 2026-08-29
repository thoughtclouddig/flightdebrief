import { describe, expect, it } from "vitest";
import { extractJson } from "./extract-json";

describe("extractJson", () => {
  it("unwraps a markdown fence", () => {
    expect(JSON.parse(extractJson('```json\n{"a":1}\n```')).a).toBe(1);
  });

  it("ignores commentary around the object", () => {
    expect(JSON.parse(extractJson('Here you go:\n{"a":1}\nHope that helps.')).a).toBe(1);
  });

  it("survives an unescaped quote inside a value, which is how a verbatim passage arrives", () => {
    const reply = '{"support": "the controller said "hold short" and moved on", "url": "https://x.test"}';
    const parsed = JSON.parse(extractJson(reply));
    expect(parsed.url).toBe("https://x.test");
    expect(parsed.support).toContain("hold short");
  });

  it("leaves correctly escaped quotes alone", () => {
    const reply = '{"support": "she said \\"cleared to land\\" clearly"}';
    expect(JSON.parse(extractJson(reply)).support).toBe('she said "cleared to land" clearly');
  });

  it("handles a quote immediately before a comma without mangling the structure", () => {
    const reply = '{"a": "ends with a quote \\"", "b": 2}';
    expect(JSON.parse(extractJson(reply)).b).toBe(2);
  });
});
