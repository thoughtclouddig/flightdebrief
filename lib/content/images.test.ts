import { describe, expect, it } from "vitest";
import { heroImageSrc, decodeDataUrl } from "./images";

const a = `data:image/avif;base64,${"A".repeat(3000)}`;
const b = `data:image/avif;base64,${"A".repeat(2900)}${"B".repeat(100)}`;

describe("heroImageSrc", () => {
  it("serves a stored image from the media route", () => {
    expect(heroImageSrc("articles", "art-1", a)).toMatch(/^\/api\/media\/articles\/art-1\?v=/);
  });

  it("changes the URL when the image changes, so a regenerated image isn't served from cache", () => {
    expect(heroImageSrc("articles", "art-1", a)).not.toBe(heroImageSrc("articles", "art-1", b));
  });

  it("is stable for the same image, so an unchanged one stays cached", () => {
    expect(heroImageSrc("articles", "art-1", a)).toBe(heroImageSrc("articles", "art-1", a));
  });

  it("passes an external URL through untouched", () => {
    expect(heroImageSrc("articles", "art-1", "https://example.com/x.jpg")).toBe("https://example.com/x.jpg");
  });

  it("returns null when there's no image", () => {
    expect(heroImageSrc("articles", "art-1", null)).toBeNull();
  });
});

describe("decodeDataUrl", () => {
  it("splits a data URL into content type and bytes", () => {
    const decoded = decodeDataUrl("data:image/avif;base64,AAAA");
    expect(decoded?.contentType).toBe("image/avif");
    expect(decoded?.bytes.length).toBeGreaterThan(0);
  });

  it("returns null for anything that isn't one", () => {
    expect(decodeDataUrl("https://example.com/x.jpg")).toBeNull();
  });
});
