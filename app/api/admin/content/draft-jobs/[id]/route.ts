import { NextResponse } from "next/server";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { getDraftJob } from "@/lib/content/draft-jobs";

/** Status of a drafting job started by generate-daily. */
export async function GET(request: Request, context: RouteContext<"/api/admin/content/draft-jobs/[id]">) {
  const { id } = await context.params;

  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const job = getDraftJob(id);
  // A job the server has forgotten -- restarted, or older than retention.
  // "unknown" rather than 404 so the desk stops polling without reporting a
  // failure for work that may well have succeeded.
  if (!job) return NextResponse.json({ state: "unknown" });

  return NextResponse.json({ state: job.state, error: job.error, articleId: job.articleId });
}
