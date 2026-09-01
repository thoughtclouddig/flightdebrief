import { authenticateMobile, unauthorized } from "@/lib/mobile/auth";
import { durations, toCreateFlightInput } from "@/lib/mobile/ingest";
import { attachFlight, loadSession, saveSession } from "@/lib/mobile/store";
import { getRepository } from "@/lib/data";

interface EndBody {
  /** Epoch ms of the END FLIGHT tap, which may be long before this request. */
  endedAt: number;
  aircraftType?: string;
}

/**
 * Finalize the session into a real Flight.
 *
 * Idempotent: ending an already-ended session returns the existing flight
 * rather than creating a second one. The phone will retry this exactly as
 * readily as it retries a telemetry batch.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobile(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = (await request.json()) as EndBody;

  const repo = getRepository();
  const user = await repo.getUserByAuthId(auth.claims.sub);
  if (!user) return unauthorized();

  const session = await loadSession(user.id, id);
  if (!session) return Response.json({ error: "no such session" }, { status: 404 });

  const ended = { ...session, endedAt: body.endedAt ?? Date.now() };
  const d = durations(ended);

  const aircraft = await repo.getOrCreateAircraft({
    tailNumber: session.aircraftTail,
    type: body.aircraftType ?? "Unknown",
    // The phone does not know the aircraft's home base and must not guess one
    // -- an aircraft record with a fabricated home airport is worse than a
    // blank field, because nothing downstream can tell it was invented.
    homeAirport: "",
  });
  const flight = await repo.createFlight(toCreateFlightInput(ended, { aircraftId: aircraft.id }));

  await saveSession(user.id, ended);
  await attachFlight(session.id, flight.id);

  return Response.json({
    flightId: flight.id,
    fixes: ended.fixes.length,
    // All three, so the client never has to guess which one is flight time.
    sessionMs: d.sessionMs,
    airborneMs: d.airborneMs,
    trackedMs: d.trackedMs,
  });
}
