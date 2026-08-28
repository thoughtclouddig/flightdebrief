import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import type { Source } from "@/lib/types";

interface CreateResearchBody {
  title: string;
  slug: string;
  summary: string;
  keyFindings?: string;
  methodology?: string;
  sampleSize?: string;
  dateRange?: string;
  definitions?: string;
  limitations?: string;
  anonymizationNote?: string;
  dataSource?: string;
  authorName: string;
  reviewerName?: string;
  sources?: Source[];
  imageUrl?: string | null;
  status: "draft" | "published";
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateResearchBody;
  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const repo = getRepository();
  const report = await repo.createResearchReport({
    slug: body.slug.trim(),
    title: body.title.trim(),
    summary: body.summary?.trim() ?? "",
    keyFindings: body.keyFindings?.trim() || null,
    methodology: body.methodology?.trim() || null,
    sampleSize: body.sampleSize?.trim() || null,
    dateRange: body.dateRange?.trim() || null,
    definitions: body.definitions?.trim() || null,
    limitations: body.limitations?.trim() || null,
    anonymizationNote: body.anonymizationNote?.trim() || null,
    dataSource: body.dataSource?.trim() || null,
    authorName: body.authorName?.trim() || "AfterFlight",
    reviewerName: body.reviewerName?.trim() || null,
    sources: body.sources ?? [],
    imageUrl: body.imageUrl ?? null,
  });

  if (body.status === "published") {
    const published = await repo.updateResearchReport(report.id, { status: "published" });
    return NextResponse.json({ report: published });
  }

  return NextResponse.json({ report });
}
