/**
 * Sweeps stored articles and research reports for British spellings.
 *
 * Generation now applies the fix (lib/ai/generate-article.ts), but anything
 * written before that still carries whatever the model produced. Reports by
 * default; pass --write to apply.
 *
 *   node scripts/fix-british-spellings.mjs          # report only
 *   node scripts/fix-british-spellings.mjs --write  # apply
 */
import pg from "pg";
import { readFileSync } from "fs";

// The word list lives in TypeScript; rather than add a build step for a
// one-off script, the mappings are read out of it directly.
const src = readFileSync(new URL("../lib/content/us-spelling.ts", import.meta.url), "utf8");
const base = {};
for (const [, b, a] of src.matchAll(/^\s{2}(\w+):\s*"(\w+)",$/gm)) base[b] = a;

const map = new Map();
for (const [b, a] of Object.entries(base)) {
  map.set(b, a);
  if (b.endsWith("ise")) {
    const bs = b.slice(0, -3), as = a.slice(0, -3);
    map.set(`${bs}ised`, `${as}ized`); map.set(`${bs}ises`, `${as}izes`);
    map.set(`${bs}ising`, `${as}izing`); map.set(`${bs}isation`, `${as}ization`);
  }
  if (b.endsWith("yse")) {
    const bs = b.slice(0, -3), as = a.slice(0, -3);
    map.set(`${bs}ysed`, `${as}yzed`); map.set(`${bs}yses`, `${as}yzes`);
    map.set(`${bs}ysing`, `${as}yzing`);
  }
  if (b.endsWith("our")) {
    map.set(`${b}s`, `${a}s`); map.set(`${b}ed`, `${a}ed`); map.set(`${b}ing`, `${a}ing`);
  }
}
map.set("manoeuvres", "maneuvers");
map.set("manoeuvred", "maneuvered");
map.set("manoeuvring", "maneuvering");

const pattern = new RegExp(`\\b(${[...map.keys()].join("|")})\\b`, "gi");

function fix(text) {
  return text.replace(pattern, (m) => {
    const r = map.get(m.toLowerCase());
    if (!r) return m;
    if (m === m.toUpperCase() && m.length > 1) return r.toUpperCase();
    if (m[0] === m[0].toUpperCase()) return r[0].toUpperCase() + r.slice(1);
    return r;
  });
}

const write = process.argv.includes("--write");
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

for (const table of ["articles", "research_reports"]) {
  const { rows } = await db.query(`SELECT id, slug, title, dek, body, body_blocks FROM ${table}`);
  for (const row of rows) {
    // body_blocks is JSON; fixing it as a string is safe here because the
    // replacements are whole words that never appear in JSON syntax.
    const blocks = row.body_blocks ? JSON.stringify(row.body_blocks) : null;
    const next = {
      title: fix(row.title ?? ""),
      dek: fix(row.dek ?? ""),
      body: fix(row.body ?? ""),
      blocks: blocks ? fix(blocks) : null,
    };

    const found = [
      ...new Set([
        ...(row.title ?? "").match(pattern) ?? [],
        ...(row.dek ?? "").match(pattern) ?? [],
        ...(row.body ?? "").match(pattern) ?? [],
        ...(blocks ?? "").match(pattern) ?? [],
      ]),
    ];
    if (found.length === 0) continue;

    console.log(`${table}/${row.slug}: ${found.join(", ")}`);
    if (!write) continue;

    await db.query(
      `UPDATE ${table} SET title = $1, dek = $2, body = $3, body_blocks = $4 WHERE id = $5`,
      [next.title, next.dek, next.body, next.blocks ? JSON.parse(next.blocks) : null, row.id],
    );
    console.log(`  fixed`);
  }
}

console.log(write ? "done" : "\nreport only -- re-run with --write to apply");
await db.end();
