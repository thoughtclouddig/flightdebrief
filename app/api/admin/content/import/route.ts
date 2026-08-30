import { NextResponse, type NextRequest } from "next/server";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { blocksPublish } from "@/lib/content/publish-guard";

/**
 * Imports a content bundle produced by scripts/export-content.mjs.
 *
 * Production runs a different database from the workspace, which is
 * deliberate -- it is what lets us develop against real data without
 * touching customers -- but it also means articles written here do not exist
 * there. The alternative was re-drafting every article against production,
 * which spends the research and the image generation a second time and
 * produces DIFFERENT articles: the pipeline isn't deterministic, and the ones
 * already reviewed are the ones worth keeping.
 *
 * Upload rather than a direct connection: the deployment's DATABASE_URL is
 * not something that should be copied around to make a migration work, and a
 * staff session already proves who you are.
 *
 * Upserts on slug, so a re-run corrects rather than duplicates.
 */

/** Every column the target actually has, so a bundle from a newer schema imports its overlap instead of failing whole. */
async function columnsOf(table: string): Promise<Set<string>> {
  const { rows } = await getDb().query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

async function upsert(table: string, rows: Record<string, unknown>[]): Promise<{ written: number; skippedColumns: string[] }> {
  if (!rows.length) return { written: 0, skippedColumns: [] };
  const target = await columnsOf(table);
  if (!target.size) throw new Error(`Table ${table} does not exist in this database.`);

  const present = Object.keys(rows[0]);
  const shared = present.filter((c) => target.has(c));
  const skippedColumns = present.filter((c) => !target.has(c));
  if (!shared.includes("slug")) throw new Error(`Bundle rows for ${table} have no slug to match on.`);

  const updates = shared.filter((c) => c !== "id" && c !== "slug");
  const placeholders = shared.map((_, i) => `$${i + 1}`).join(",");
  const sql =
    `INSERT INTO ${table} (${shared.join(",")}) VALUES (${placeholders}) ` +
    `ON CONFLICT (slug) DO UPDATE SET ${updates.map((c) => `${c} = EXCLUDED.${c}`).join(", ")}`;

  for (const row of rows) {
    // jsonb columns arrive as parsed JSON; pg needs them stringified.
    await getDb().query(
      sql,
      shared.map((c) => {
        const v = row[c];
        return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
      }),
    );
  }
  return { written: rows.length, skippedColumns };
}

export async function POST(request: NextRequest) {
  const { response } = await authorizeSuperadmin();
  if (response) return response;

  let bundle: { topics?: Record<string, unknown>[]; articles?: Record<string, unknown>[]; research?: Record<string, unknown>[] };
  try {
    bundle = await request.json();
  } catch {
    return NextResponse.json({ error: "That file isn't JSON." }, { status: 400 });
  }
  if (!bundle || typeof bundle !== "object") {
    return NextResponse.json({ error: "That file isn't a content bundle." }, { status: 400 });
  }

  const topics = bundle.topics ?? [];
  const allArticles = bundle.articles ?? [];
  const research = bundle.research ?? [];

  // The same rule the publish routes enforce. An unsourced article is written
  // from the model's memory and reviewed by a fact-checker with no search
  // tools; carrying one in through the side door would be a way of using the
  // guard to avoid the guard.
  const refused: string[] = [];
  const articles = allArticles.filter((a) => {
    const sources = Array.isArray(a.sources) ? (a.sources as unknown[]) : [];
    if (a.status === "published" && blocksPublish(sources as never)) {
      refused.push(String(a.slug));
      return false;
    }
    return true;
  });

  try {
    // Topics first: articles reference them.
    const t = await upsert("resource_topics", topics);
    const a = await upsert("articles", articles);
    const r = await upsert("research_reports", research);
    return NextResponse.json({
      ok: true,
      topics: t.written,
      articles: a.written,
      research: r.written,
      refused,
      skippedColumns: [...new Set([...t.skippedColumns, ...a.skippedColumns, ...r.skippedColumns])],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[content-import] failed:", detail);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
