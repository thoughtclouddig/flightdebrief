import sharp from "sharp";

/**
 * Hero images for articles and research reports.
 *
 * Two decisions live here.
 *
 * AVIF, at a bounded width. The generator returns a 1024px PNG, which lands
 * around 2MB; the same picture as AVIF is roughly 1-2% of that with no visible
 * difference at the sizes these are displayed. Encoding happens once, at
 * generation, rather than on every request.
 *
 * Served from a URL, not inlined. These are stored as data: URLs in Postgres
 * (the app has no object storage, same pattern as users.avatar_url), and a
 * data: URL in a server-rendered page is pasted into both the HTML and the
 * RSC payload -- one 2MB image made /resources a 4.3MB response that could
 * never be cached separately from the page. heroImageSrc() hands the browser
 * a stable URL instead, so the bytes come down once and stay cached.
 */

/** Max stored width. Displayed at most ~900px, doubled for high-density screens. */
const MAX_WIDTH = 1800;

export async function encodeHeroImage(input: Buffer): Promise<string> {
  const avif = await sharp(input)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    // effort 4 rather than the default 4..9 sweet spot: this runs inside a
    // request that a person is waiting on, and the extra seconds buy a few
    // percent.
    .avif({ quality: 55, effort: 4 })
    .toBuffer();
  return `data:image/avif;base64,${avif.toString("base64")}`;
}

export interface DecodedImage {
  contentType: string;
  bytes: Buffer;
}

/** Splits a stored data: URL back into bytes. Returns null for anything else. */
export function decodeDataUrl(url: string): DecodedImage | null {
  const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(url);
  if (!match) return null;
  return { contentType: match[1], bytes: Buffer.from(match[2], "base64") };
}

/**
 * What to put in an <img src>. External URLs pass through untouched -- someone
 * pasting a normal https:// link into the CMS should keep it.
 */
export function heroImageSrc(kind: "articles" | "research", id: string, imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (!imageUrl.startsWith("data:")) return imageUrl;
  return `/api/media/${kind}/${id}`;
}
