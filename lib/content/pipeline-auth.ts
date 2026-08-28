import { timingSafeEqual } from "node:crypto";

/**
 * Bearer check for scheduled callers of the content pipeline. Constant-time,
 * and shared by the ideas and drafting routes so the two can't drift apart.
 */
export function hasContentPipelineSecret(request: Request): boolean {
  const expected = process.env.CONTENT_PIPELINE_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
