import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

/**
 * Approve or reject one idea. Approving doesn't write anything -- it moves the
 * idea into the queue the drafting run picks up, so a decision stays a
 * one-click action rather than a wait.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/content/ideas/[id]">) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as { status?: string };
  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
  }

  const idea = await getRepository().setArticleIdeaStatus(id, body.status);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ idea });
}
