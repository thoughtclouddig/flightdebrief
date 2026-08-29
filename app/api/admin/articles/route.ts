import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { blocksPublish } from "@/lib/content/publish-guard";
import type { Source } from "@/lib/types";

interface CreateArticleBody {
  title: string;
  slug: string;
  topicId: string | null;
  dek: string;
  body: string;
  authorName: string;
  sources?: Source[];
  imageUrl?: string | null;
  status: "draft" | "published";
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateArticleBody;
  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  // Checked before anything is written, so a blocked publish does not leave a
  // half-made article behind.
  if (body.status === "published") {
    const blocked = blocksPublish(body.sources);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 422 });
  }

  const repo = getRepository();
  const article = await repo.createArticle({
    slug: body.slug.trim(),
    topicId: body.topicId || null,
    title: body.title.trim(),
    dek: body.dek?.trim() ?? "",
    body: body.body ?? "",
    authorName: body.authorName?.trim() || "AfterFlight",
    sources: body.sources ?? [],
    imageUrl: body.imageUrl ?? null,
  });

  if (body.status === "published") {
    const published = await repo.updateArticle(article.id, { status: "published" });
    return NextResponse.json({ article: published });
  }

  return NextResponse.json({ article });
}
