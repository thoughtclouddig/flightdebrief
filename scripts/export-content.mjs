/**
 * Dumps this database's content into a bundle for the production import.
 *
 *   node scripts/export-content.mjs                  # published only
 *   node scripts/export-content.mjs --drafts         # drafts too
 *   node scripts/export-content.mjs --out bundle.json
 *
 * Pairs with POST /api/admin/content/import, which you upload the file to
 * from the staff content desk while signed in. Deliberately not a direct
 * database-to-database copy: production's DATABASE_URL is not something that
 * should be passed around to make a migration work.
 *
 * Images travel with the row -- they are data: URLs in image_url, not object
 * storage -- which is why the file is large.
 */
import pg from "pg";
import { writeFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[export] DATABASE_URL is not set.");
  process.exit(1);
}

const INCLUDE_DRAFTS = process.argv.includes("--drafts");
const outIndex = process.argv.indexOf("--out");
const OUT = outIndex !== -1 ? process.argv[outIndex + 1] : "content-bundle.json";

const client = new pg.Client({ connectionString: url });
await client.connect();

const statusFilter = INCLUDE_DRAFTS ? "" : "WHERE status = 'published'";
const { rows: topics } = await client.query("SELECT * FROM resource_topics ORDER BY name");
const { rows: articles } = await client.query(`SELECT * FROM articles ${statusFilter} ORDER BY published_at NULLS LAST`);
const { rows: research } = await client.query(`SELECT * FROM research_reports ${statusFilter} ORDER BY created_at`);
// Ideas always, whatever --drafts says: the queue is the part of the desk
// that says what happens next, and an empty one on production reads as
// "nothing planned" rather than "not copied yet". Rejected ones stay behind --
// a decision already made doesn't need repeating on another machine.
const { rows: ideas } = await client.query(
  "SELECT * FROM article_ideas WHERE status <> 'rejected' ORDER BY created_at",
);

// Reported here as well as refused at import, so the gap is visible before
// you upload rather than as a surprise in the result.
const unsourced = articles.filter(
  (a) => a.status === "published" && (!Array.isArray(a.sources) || a.sources.length === 0),
);

writeFileSync(OUT, JSON.stringify({ topics, articles, research, ideas }, null, 2));

console.log(`[export] ${OUT}`);
console.log(`[export] topics: ${topics.length}`);
console.log(`[export] articles: ${articles.length}${INCLUDE_DRAFTS ? " (including drafts)" : " (published only)"}`);
for (const a of articles) console.log(`           ${String(a.status).padEnd(9)} ${a.slug}`);
console.log(`[export] research reports: ${research.length}`);
console.log(`[export] ideas in the queue: ${ideas.length}`);
for (const i of ideas) console.log(`           ${String(i.status).padEnd(9)} ${i.title}`);
if (!INCLUDE_DRAFTS) {
  console.log(`\n[export] Drafts were NOT included. Re-run with --drafts to carry unpublished articles too.`);
}
if (unsourced.length) {
  console.log(`\n[export] ${unsourced.length} published article(s) have no sources and WILL BE REFUSED on import:`);
  for (const a of unsourced) console.log(`           ${a.slug}`);
}

await client.end();
