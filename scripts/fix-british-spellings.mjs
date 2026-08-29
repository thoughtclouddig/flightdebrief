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

// The two tables hold prose in different columns -- research_reports has no
// dek or body_blocks, and carries its narrative across several named fields
// instead. Listing them per table beats assuming a shared shape.
const TABLES = [
  { name: "articles", columns: ["title", "dek", "body"], jsonColumns: ["body_blocks"] },
  {
    name: "research_reports",
    columns: [
      "title",
      "summary",
      "key_findings",
      "methodology",
      "definitions",
      "limitations",
      "anonymization_note",
    ],
    jsonColumns: [],
  },
];

for (const table of TABLES) {
  const all = [...table.columns, ...table.jsonColumns];
  const { rows } = await db.query(`SELECT id, slug, ${all.join(", ")} FROM ${table.name}`);

  for (const row of rows) {
    const updates = {};
    const found = new Set();

    for (const column of table.columns) {
      const value = row[column];
      if (typeof value !== "string" || !value) continue;
      for (const m of value.match(pattern) ?? []) found.add(m);
      updates[column] = fix(value);
    }
    for (const column of table.jsonColumns) {
      if (row[column] == null) continue;
      // Whole-word replacements never collide with JSON syntax, so fixing the
      // serialized form is safe and keeps the structure untouched.
      const text = JSON.stringify(row[column]);
      for (const m of text.match(pattern) ?? []) found.add(m);
      updates[column] = JSON.parse(fix(text));
    }

    if (found.size === 0) continue;
    console.log(`${table.name}/${row.slug}: ${[...found].join(", ")}`);
    if (!write) continue;

    const keys = Object.keys(updates);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    await db.query(
      `UPDATE ${table.name} SET ${sets} WHERE id = $${keys.length + 1}`,
      [...keys.map((k) => updates[k]), row.id],
    );
    console.log("  fixed");
  }
}

console.log(write ? "done" : "\nreport only -- re-run with --write to apply");
await db.end();
