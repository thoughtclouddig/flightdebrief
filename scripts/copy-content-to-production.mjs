/**
 * Copies published content from the workspace database to production.
 *
 *   node scripts/copy-content-to-production.mjs            # dry run, writes nothing
 *   node scripts/copy-content-to-production.mjs --write
 *   node scripts/copy-content-to-production.mjs --write --drafts
 *
 * Needs PROD_DATABASE_URL alongside the usual DATABASE_URL. Production is a
 * separate database from the workspace -- that separation is deliberate and is
 * what lets us develop against real data without touching customers -- but it
 * also means content written here does not exist there.
 *
 * The alternative was re-drafting every article against production, which
 * would spend the research and image generation a second time and produce
 * DIFFERENT articles: the pipeline is not deterministic, and the ones already
 * reviewed and corrected are the ones worth keeping.
 *
 * WHAT IT MOVES
 * resource_topics, then articles, then research_reports -- topics first
 * because articles reference them. Images travel with the row: they are
 * stored as data: URLs in image_url, not in object storage.
 *
 * WHAT IT WILL NOT MOVE
 * An article with no sources. The app refuses to publish those
 * (lib/content/publish-guard.ts) because an unsourced article is written from
 * the model's memory and checked by a fact-checker with no search tools. A
 * migration that quietly carried them into production would be a way of
 * using the rule to avoid the rule.
 *
 * Matched on slug and upserted, so a second run updates rather than
 * duplicates -- and so a correction made here can be re-copied.
 */
import pg from "pg";

const SOURCE_URL = process.env.DATABASE_URL;
const TARGET_URL = process.env.PROD_DATABASE_URL;

if (!SOURCE_URL) {
  console.error("[copy] DATABASE_URL is not set -- that is the source (this workspace).");
  process.exit(1);
}
if (!TARGET_URL) {
  console.error("[copy] PROD_DATABASE_URL is not set.");
  console.error("[copy] Find it in Replit under the DEPLOYMENT's database pane -- the deployment");
  console.error("[copy] has its own database, and the workspace's DATABASE_URL is not it.");
  process.exit(1);
}
if (SOURCE_URL === TARGET_URL) {
  // Copying a database onto itself is always a mistake, and an upsert makes
  // it a silent one.
  console.error("[copy] DATABASE_URL and PROD_DATABASE_URL are the same database. Refusing.");
  process.exit(1);
}

const WRITE = process.argv.includes("--write");
const INCLUDE_DRAFTS = process.argv.includes("--drafts");

const source = new pg.Client({ connectionString: SOURCE_URL });
const target = new pg.Client({ connectionString: TARGET_URL });
await source.connect();
await target.connect();

console.log(`[copy] ${WRITE ? "WRITING to production" : "DRY RUN -- nothing will be written"}`);

/** Every column the table has here, so a schema addition does not need this script edited. */
async function columnsOf(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

/**
 * Upsert rows into the target on a natural key.
 *
 * Only the columns both databases have. Production runs the same schema, but
 * it is migrated by the build, so a column added here since the last publish
 * may not exist there yet -- copying it would fail the whole run rather than
 * the one field.
 */
async function copyRows(table, conflictColumn, rows) {
  if (!rows.length) return { copied: 0, skippedColumns: [] };

  const [sourceCols, targetCols] = await Promise.all([columnsOf(source, table), columnsOf(target, table)]);
  const shared = sourceCols.filter((c) => targetCols.includes(c));
  const skippedColumns = sourceCols.filter((c) => !targetCols.includes(c));

  if (!WRITE) return { copied: rows.length, skippedColumns };

  const updates = shared.filter((c) => c !== "id" && c !== conflictColumn);
  for (const row of rows) {
    const values = shared.map((c) => row[c]);
    const placeholders = shared.map((_, i) => `$${i + 1}`).join(",");
    await target.query(
      `INSERT INTO ${table} (${shared.join(",")}) VALUES (${placeholders})
       ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updates.map((c) => `${c} = EXCLUDED.${c}`).join(", ")}`,
      values,
    );
  }
  return { copied: rows.length, skippedColumns };
}

// --- Topics first: articles reference them. -------------------------------
const { rows: topics } = await source.query("SELECT * FROM resource_topics ORDER BY name");
const topicResult = await copyRows("resource_topics", "slug", topics);
console.log(`[copy] topics: ${topicResult.copied}`);

// --- Articles -------------------------------------------------------------
const statusFilter = INCLUDE_DRAFTS ? "" : "WHERE status = 'published'";
const { rows: allArticles } = await source.query(`SELECT * FROM articles ${statusFilter} ORDER BY published_at`);

// The same rule the publish route enforces. An unsourced article is written
// from the model's memory and reviewed by a fact-checker with no search
// tools; carrying it in through the side door would defeat the guard.
const unsourced = allArticles.filter((a) => !Array.isArray(a.sources) || a.sources.length === 0);
const articles = allArticles.filter((a) => Array.isArray(a.sources) && a.sources.length > 0);

const articleResult = await copyRows("articles", "slug", articles);
console.log(`[copy] articles: ${articleResult.copied}${INCLUDE_DRAFTS ? " (including drafts)" : " (published only)"}`);
for (const a of articles) console.log(`         ${a.status.padEnd(9)} ${a.slug}`);

if (unsourced.length) {
  console.log(`\n[copy] SKIPPED ${unsourced.length} article(s) with no sources -- production refuses to publish these:`);
  for (const a of unsourced) console.log(`         ${a.slug}`);
  console.log(`[copy] Redraft them, or add citations, and re-run.`);
}

// --- Research reports -----------------------------------------------------
const { rows: reports } = await source.query(
  `SELECT * FROM research_reports ${INCLUDE_DRAFTS ? "" : "WHERE status = 'published'"} ORDER BY created_at`,
);
const reportResult = await copyRows("research_reports", "slug", reports);
console.log(`\n[copy] research reports: ${reportResult.copied}`);

const skipped = [...new Set([...topicResult.skippedColumns, ...articleResult.skippedColumns, ...reportResult.skippedColumns])];
if (skipped.length) {
  // Silently dropping a column is how content arrives subtly incomplete.
  console.log(`\n[copy] Columns that exist here but not in production, so were NOT copied: ${skipped.join(", ")}`);
  console.log(`[copy] Publish production first so its schema catches up, then re-run.`);
}

console.log(
  WRITE
    ? "\n[copy] Done. Check /field-notes on production."
    : "\n[copy] Dry run only. Re-run with --write to copy.",
);

await source.end();
await target.end();
