import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";
import { recordNotFound } from "@/lib/auth/guard";
import type { ArticleStatus, Source } from "@/lib/types";

interface UpdateArticleBody {
  title?: string;
  slug?: string;
  topicId?: string | null;
  dek?: string;
  body?: string;
  authorName?: string;
  sources?: Source[];
  imageUrl?: string | null;
  status?: ArticleStatus;
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/articles/[id]">) {
  const { id } = await context.params;
  const body = (await request.json()) as UpdateArticleBody;

  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const repo = getRepository();
  const existing = await repo.getArticle(id);
  if (!existing) return recordNotFound();

  const article = await repo.updateArticle(id, {
    title: body.title?.trim(),
    slug: body.slug?.trim(),
    topicId: body.topicId,
    dek: body.dek?.trim(),
    body: body.body,
    authorName: body.authorName?.trim(),
    sources: body.sources,
    imageUrl: body.imageUrl,
    status: body.status,
  });

  return NextResponse.json({ article });
}
