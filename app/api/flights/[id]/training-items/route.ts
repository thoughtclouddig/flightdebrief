import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import type { TrainingItemCategory } from "@/lib/types";

interface AddTrainingItemBody {
  category: TrainingItemCategory;
  description: string;
}

/**
 * A CFI adding their own item to "Needs Work" (keep_working_on) or "Action
 * Items" (before_next_flight) alongside whatever the debrief analysis
 * already generated -- see the same two categories created from the
 * transcript in app/api/debrief/analyze/route.ts. Requires a Debrief to
 * already exist for this flight; there's nothing to attach a training item
 * to before that.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/flights/[id]/training-items">) {
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
    return NextResponse.json({ error: "No debrief has been recorded for this flight yet" }, { status: 400 });
  }

  const body = (await request.json()) as AddTrainingItemBody;
  if (body.category !== "keep_working_on" && body.category !== "before_next_flight") {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }

  const [item] = await repo.createTrainingItems([
    {
      flightId: id,
      debriefId: debrief.id,
      category: body.category,
      description,
      done: false,
      completedAt: null,
      visibility: "shared",
    },
  ]);

  return NextResponse.json({ item });
}
