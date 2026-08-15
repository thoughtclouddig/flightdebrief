import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface ReorderBody {
  orderedCardIds: string[];
}

/** Back/reprioritize during the Guided Debrief -- persists the CFI's current card order. */
export async function POST(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/cards/reorder">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const body = (await request.json()) as ReorderBody;
  const cards = await repo.listCards(id);
  const cardIds = new Set(cards.map((c) => c.id));
  if (!Array.isArray(body.orderedCardIds) || body.orderedCardIds.length !== cards.length || !body.orderedCardIds.every((cid) => cardIds.has(cid))) {
    return NextResponse.json({ error: "orderedCardIds must match the flight's existing cards" }, { status: 400 });
  }

  await repo.reorderCards(body.orderedCardIds);
  return NextResponse.json({ ok: true });
}
