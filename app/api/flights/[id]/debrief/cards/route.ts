import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface AddTopicBody {
  title: string;
  primaryPrompt: string;
}

/** "Add Topic" during the Guided Debrief -- the CFI inserts an ad-hoc discussion card mid-session. */
export async function POST(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/cards">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const body = (await request.json()) as AddTopicBody;
  if (!body.title?.trim() || !body.primaryPrompt?.trim()) {
    return NextResponse.json({ error: "Missing title or primaryPrompt" }, { status: 400 });
  }

  const existingCards = await repo.listCards(id);
  const nextSortOrder = existingCards.length > 0 ? Math.max(...existingCards.map((c) => c.sortOrder)) + 1 : 0;

  const [card] = await repo.createCards([
    {
      flightId: id,
      cardDefinitionId: null,
      flightTaskId: null,
      source: "instructor_selected",
      category: "CUSTOM",
      title: body.title.trim(),
      primaryPrompt: body.primaryPrompt.trim(),
      followUpPrompts: [],
      acsArea: null,
      acsAreaUrl: null,
      studentRating: null,
      instructorRating: null,
      discrepancyStatus: "none",
      sortOrder: nextSortOrder,
      status: "pending",
      flaggedForFollowUp: false,
      recordingStartSeconds: null,
      recordingEndSeconds: null,
    },
  ]);

  return NextResponse.json({ card });
}
