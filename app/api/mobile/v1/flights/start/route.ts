import { authenticateMobile, unauthorized } from "@/lib/mobile/auth";
import { createSession, MOBILE_API_VERSION, type DeviceInfo } from "@/lib/mobile/ingest";
import { saveSession } from "@/lib/mobile/store";
import { getRepository } from "@/lib/data";

interface StartBody {
  /** Client-generated so the phone owns the id before it ever reaches us. */
  sessionId: string;
  /** Epoch ms of the START FLIGHT tap -- NOT of this request. */
  t0: number;
  aircraftTail: string;
  instructorId?: string | null;
  device: DeviceInfo;
}

/**
 * Begin a recording session.
 *
 * The client keeps flying whether or not this succeeds: it has already set t0
 * and started writing fixes to SQLite. This call exists so the server knows a
 * session is open, and so recovery can find it -- not as a gate. A student on
 * a ramp with no signal must still be able to record.
 *
 * t0 comes from the client and is trusted. Using the request time instead
 * would silently shift every fix by however long the phone waited for signal,
 * and t0 is the origin cockpit audio and video will later stamp against.
 */
export async function POST(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth) return unauthorized();

  const body = (await request.json()) as StartBody;
  if (!body.sessionId || !body.t0 || !body.aircraftTail) {
    return Response.json({ error: "sessionId, t0 and aircraftTail are required" }, { status: 400 });
  }

  const repo = getRepository();
  const user = await repo.getUserByAuthId(auth.claims.sub);
  if (!user) return unauthorized();

  const session = createSession({
    id: body.sessionId,
    userId: user.id,
    t0: body.t0,
    aircraftTail: body.aircraftTail,
    instructorId: body.instructorId ?? null,
    device: body.device,
  });
  await saveSession(user.id, session);

  return Response.json({ version: MOBILE_API_VERSION, sessionId: session.id, t0: session.t0 });
}
