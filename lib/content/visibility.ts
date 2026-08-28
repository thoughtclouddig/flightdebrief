/**
 * Whether the public content surface (/resources, /research) is reachable.
 *
 * Off unless CONTENT_PUBLIC is explicitly set. Fail-closed on purpose: the
 * articles pipeline can produce and publish drafts before the design and
 * editorial standards are settled, and a half-finished article that gets
 * crawled is not something you can take back -- it's indexed, it may be
 * cited by an answer engine, and it becomes the first impression of the
 * brand for whoever finds it.
 *
 * The flag covers every way the content can be discovered, not just the
 * pages: sitemap entries, llms.txt listings, and the footer links. Hiding
 * only the nav would leave the URLs crawlable and listed.
 */
export function isContentPublic(): boolean {
  const flag = (process.env.CONTENT_PUBLIC ?? "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}
