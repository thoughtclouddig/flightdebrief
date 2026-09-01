import { authenticateMobile, unauthorized } from "@/lib/mobile/auth";
import { loadActiveSession } from "@/lib/mobile/store";
import { getRepository } from "@/lib/data";

/**
 * What the server believes is still open.
 *
 * Called on app relaunch so the client can reconcile: the phone's SQLite is
 * the source of truth for FIXES, and this is the source of truth for whether
 * the server ever heard about the session. The two are compared rather than
 * one overwriting the other -- an OS kill loses neither.
 */
export async function POST(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth) return unauthorized();

  const repo = getRepository();
  const user = await repo.getUserByAuthId(auth.claims.sub);
  if (!user) return unauthorized();

  const session = await loadActiveSession(user.id);
  if (!session) return Response.json({ active: null });

  return Response.json({
    active: {
      sessionId: session.id,
      t0: session.t0,
      aircraftTail: session.aircraftTail,
      // So the client knows which of its local batches the server already has.
      fixesOnServer: session.fixes.length,
      seenBatchKeys: session.seenBatchKeys,
    },
  });
}
