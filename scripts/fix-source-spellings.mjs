/**
 * Sweeps SOURCE for British spellings -- code, comments, UI copy, docs.
 *
 * lib/content/us-spelling.ts already fixed generated ARTICLES, and
 * fix-british-spellings.mjs already fixed stored ones. Neither ever looked at
 * the repository itself, so every hand-written string, JSX label and comment
 * was uncovered -- which is exactly where the British forms kept coming back.
 * This closes that gap; us-spelling.source.test.ts keeps it closed.
 *
 *   node scripts/fix-source-spellings.mjs          # report only
 *   node scripts/fix-source-spellings.mjs --write  # apply
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

const src = readFileSync(join(ROOT, "lib/content/us-spelling.ts"), "utf8");
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

/**
 * Words that must NOT be rewritten in source, with the reason. Both are
 * spellings the code does not own.
 */
export const PROTECTED = {
  // Web Audio API. AudioContext.createAnalyser() is spelled this way by the
  // spec; renaming it breaks the call.
  analyser: "Web Audio API method name",
  analysers: "Web Audio API method name",
  Analyser: "Web Audio API method name",
  AnalyserNode: "Web Audio API type name",
  // Persisted enum. ReservationStatus rows in Postgres literally contain
  // 'cancelled'; changing the string needs a data migration, not a sweep.
  cancelled: "persisted ReservationStatus value -- needs a migration",
  cancelling: "persisted ReservationStatus value -- needs a migration",
  Cancelled: "persisted ReservationStatus value -- needs a migration",
};
for (const word of Object.keys(PROTECTED)) map.delete(word.toLowerCase());

export const PATTERN = new RegExp(`\\b(${[...map.keys()].join("|")})\\b`, "gi");
export const REPLACEMENTS = map;

/** Files that contain British spellings on purpose. */
export const ALLOWED_FILES = [
  "lib/content/us-spelling.ts",
  "lib/content/us-spelling.test.ts",
  "lib/content/us-spelling.source.test.ts",
  "scripts/fix-british-spellings.mjs",
  "scripts/fix-source-spellings.mjs",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".next-build",
  ".git",
  ".claude",
  ".local",
  ".agents",
  "attached_assets",
  "dist",
]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".css", ".json"]);

export function sourceFiles(root = ROOT) {
  const out = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (EXTS.has(extname(entry))) {
        const rel = relative(root, full);
        if (!ALLOWED_FILES.includes(rel) && !rel.includes("package-lock")) out.push(rel);
      }
    }
  })(root);
  return out;
}

export function fix(text) {
  return text.replace(PATTERN, (m) => {
    const r = map.get(m.toLowerCase());
    if (!r) return m;
    if (m === m.toUpperCase() && m.length > 1) return r.toUpperCase();
    if (m[0] === m[0].toUpperCase()) return r[0].toUpperCase() + r.slice(1);
    return r;
  });
}

if (process.argv[1] && process.argv[1].endsWith("fix-source-spellings.mjs")) {
  const write = process.argv.includes("--write");
  let files = 0, hits = 0;
  for (const rel of sourceFiles()) {
    const full = join(ROOT, rel);
    const text = readFileSync(full, "utf8");
    const found = text.match(PATTERN);
    if (!found) continue;
    files++; hits += found.length;
    console.log(`${rel}: ${[...new Set(found)].join(", ")}`);
    if (write) writeFileSync(full, fix(text));
  }
  console.log(`\n${hits} spellings in ${files} files.`);
  console.log(write ? "fixed" : "report only -- re-run with --write to apply");
}
