import { NextResponse } from "next/server";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";

interface UpdateCueBody {
  cue?: string;
}

/**
 * Lets the student edit their own Next Flight Cue on the Debrief Replay --
 * doubles as the "one thing to remember" reflection, so only the student who
 * flew (not the instructor) can set it.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/cue">) {
  const { id } = await params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { viewer, flight } = authorized;
  if (viewer.user.id !== flight.userId) {
    return NextResponse.json({ error: "Only the student can edit this" }, { status: 403 });
  }

  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as UpdateCueBody;
  const cue = typeof body.cue === "string" ? body.cue.trim().slice(0, 200) : null;
  if (cue === null) return NextResponse.json({ error: "cue is required" }, { status: 400 });

  await repo.updateDebriefCue(debrief.id, cue);
  return NextResponse.json({ ok: true, cue });
}
