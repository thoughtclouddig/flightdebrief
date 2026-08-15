import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import type { DebriefCardStatus } from "@/lib/types";

interface UpdateCardBody {
  status?: DebriefCardStatus;
  flaggedForFollowUp?: boolean;
  recordingStartSeconds?: number;
  recordingEndSeconds?: number;
}

/**
 * Card controls during the Guided Debrief: Next/Back/Skip/End Debrief set
 * `status`; "Mark for Follow-Up" sets `flaggedForFollowUp` (read by the next
 * flight's previous_flight_issue tier); timing is logged when a card becomes
 * inactive so transcript segments can be built afterward.
 */
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/flights/[id]/debrief/cards/[cardId]">,
) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id, cardId } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const cards = await repo.listCards(id);
  if (!cards.some((c) => c.id === cardId)) return recordNotFound();

  const body = (await request.json()) as UpdateCardBody;

  if (body.status) {
    await repo.updateCardStatus(cardId, body.status);
  }
  if (typeof body.flaggedForFollowUp === "boolean") {
    await repo.setCardFlaggedForFollowUp(cardId, body.flaggedForFollowUp);
  }
  if (typeof body.recordingStartSeconds === "number" && typeof body.recordingEndSeconds === "number") {
    await repo.updateCardTiming(cardId, body.recordingStartSeconds, body.recordingEndSeconds);
  }

  return NextResponse.json({ ok: true });
}
