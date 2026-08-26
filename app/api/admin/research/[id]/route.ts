import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import type { ArticleStatus, Source } from "@/lib/types";

interface UpdateResearchBody {
  title?: string;
  slug?: string;
  summary?: string;
  keyFindings?: string;
  methodology?: string;
  sampleSize?: string;
  dateRange?: string;
  definitions?: string;
  limitations?: string;
  anonymizationNote?: string;
  dataSource?: string;
  authorName?: string;
  reviewerName?: string;
  sources?: Source[];
  status?: ArticleStatus;
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/research/[id]">) {
  const { id } = await context.params;
  const body = (await request.json()) as UpdateResearchBody;

  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const repo = getRepository();
  const existing = await repo.getResearchReport(id);
  if (!existing) return recordNotFound();

  const report = await repo.updateResearchReport(id, {
    title: body.title?.trim(),
    slug: body.slug?.trim(),
    summary: body.summary?.trim(),
    keyFindings: body.keyFindings?.trim() || null,
    methodology: body.methodology?.trim() || null,
    sampleSize: body.sampleSize?.trim() || null,
    dateRange: body.dateRange?.trim() || null,
    definitions: body.definitions?.trim() || null,
    limitations: body.limitations?.trim() || null,
    anonymizationNote: body.anonymizationNote?.trim() || null,
    dataSource: body.dataSource?.trim() || null,
    authorName: body.authorName?.trim(),
    reviewerName: body.reviewerName?.trim() || null,
    sources: body.sources,
    status: body.status,
  });

  return NextResponse.json({ report });
}
