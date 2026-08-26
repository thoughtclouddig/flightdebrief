import { describe, expect, it } from "vitest";
import { classifyReferrer } from "./classify-referrer";

describe("classifyReferrer", () => {
  it("classifies known AI answer engines", () => {
    expect(classifyReferrer("https://chatgpt.com/")).toBe("chatgpt");
    expect(classifyReferrer("https://chat.openai.com/c/abc")).toBe("chatgpt");
    expect(classifyReferrer("https://www.perplexity.ai/search?q=x")).toBe("perplexity");
    expect(classifyReferrer("https://gemini.google.com/app")).toBe("gemini");
    expect(classifyReferrer("https://copilot.microsoft.com/")).toBe("copilot");
    expect(classifyReferrer("https://claude.ai/chat/abc")).toBe("claude");
  });

  it("classifies bing and google at the coarse level it can actually measure", () => {
    expect(classifyReferrer("https://www.bing.com/search?q=x")).toBe("bing");
    expect(classifyReferrer("https://www.google.com/search?q=x")).toBe("search_google");
  });

  it("treats empty/missing referrer as direct", () => {
    expect(classifyReferrer(null)).toBe("direct");
    expect(classifyReferrer(undefined)).toBe("direct");
    expect(classifyReferrer("")).toBe("direct");
  });

  it("falls back to other for unrecognized or malformed referrers", () => {
    expect(classifyReferrer("https://example.com/blog")).toBe("other");
    expect(classifyReferrer("not-a-url")).toBe("other");
  });
});
