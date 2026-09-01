import { authenticateMobile, unauthorized } from "@/lib/mobile/auth";
import { ingestBatch, type MobileFix } from "@/lib/mobile/ingest";
import { loadSession, saveSession } from "@/lib/mobile/store";
import { getRepository } from "@/lib/data";

interface TelemetryBody {
  idempotencyKey: string;
  fixes: MobileFix[];
}

/**
 * Accept a batch of fixes.
 *
 * All the logic is in ingestBatch -- this route authenticates, loads, folds,
 * saves. Duplicating any of the dedupe or ordering rules here would create a
 * second place they can drift.
 *
 * A duplicate is a 200, not a 409. The client is retrying because it never
 * heard back, and the correct answer to "did you get this?" is yes.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobile(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = (await request.json()) as TelemetryBody;
  if (!body.idempotencyKey || !Array.isArray(body.fixes)) {
    return Response.json({ error: "idempotencyKey and fixes are required" }, { status: 400 });
  }

  const repo = getRepository();
  const user = await repo.getUserByAuthId(auth.claims.sub);
  if (!user) return unauthorized();

  const session = await loadSession(user.id, id);
  if (!session) return Response.json({ error: "no such session" }, { status: 404 });

  const result = ingestBatch(session, { idempotencyKey: body.idempotencyKey, sessionId: id, fixes: body.fixes });
  if (!result.duplicate) await saveSession(user.id, result.session);

  return Response.json({
    state: result.state,
    duplicate: result.duplicate,
    accepted: result.accepted,
    totalFixes: result.session.fixes.length,
  });
}
