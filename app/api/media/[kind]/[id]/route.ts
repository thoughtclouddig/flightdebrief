import { NextResponse, type NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { decodeDataUrl } from "@/lib/content/images";
import { getStaffViewer } from "@/lib/auth/staff";

/**
 * Serves a hero image stored as a data: URL in Postgres, so pages can carry a
 * URL instead of two megabytes of base64. See lib/content/images.ts.
 *
 * Immutable caching is safe because changing an image means re-encoding it,
 * and these are only ever replaced wholesale.
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/media/[kind]/[id]">) {
  const { kind, id } = await context.params;
  if (kind !== "articles" && kind !== "research") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const repo = getRepository();
  const record = kind === "articles" ? await repo.getArticle(id) : await repo.getResearchReport(id);
  if (!record?.imageUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A draft's image is part of unpublished work: visible to staff previewing
  // it, not to anyone who guesses an id.
  if (record.status !== "published" && !(await getStaffViewer())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const decoded = decodeDataUrl(record.imageUrl);
  if (!decoded) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(decoded.bytes), {
    headers: {
      "Content-Type": decoded.contentType,
      "Content-Length": String(decoded.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
