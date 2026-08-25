import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface MarkViewedBody {
  url?: string;
}

/** Records that the signed-in student clicked a recommended study resource -- see db/schema.sql's study_resource_views comment for why no duration/completion state is tracked, only first-open. */
export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const body = (await request.json()) as MarkViewedBody;
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  await getRepository().markStudyResourceViewed({ studentId: auth.viewer.user.id, url });
  return NextResponse.json({ ok: true });
}
