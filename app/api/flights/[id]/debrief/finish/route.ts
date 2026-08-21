import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

/**
 * Marks a guided/light-mode debrief complete once the CFI has walked through
 * the generated summary with the student on /review -- see the analyze
 * route's guidanceMode check, which skips the immediate complete-flip for
 * anything but freeform mode specifically so this endpoint is the one place
 * that finalizes a debrief.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/finish">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) {
    return NextResponse.json({ error: "No debrief has been recorded for this flight yet." }, { status: 400 });
  }

  await repo.setFlightDebriefStatus(id, "complete");

  return NextResponse.json({ ok: true });
}
