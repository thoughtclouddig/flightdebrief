import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { skillLabel } from "@/lib/topics";
import type { TrainingSkill } from "@/lib/types";

interface SetTasksBody {
  taskCodes: TrainingSkill[];
}

/** CFI's "Flight Complete" task picker -- which maneuvers were flown, driving both self-assessment screens. Replaces the flight's full task list. */
export async function POST(request: Request, { params }: RouteContext<"/api/flights/[id]/tasks">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const body = (await request.json()) as SetTasksBody;
  if (!Array.isArray(body.taskCodes) || body.taskCodes.length === 0) {
    return NextResponse.json({ error: "At least one task is required" }, { status: 400 });
  }

  const tasks = await repo.setFlightTasks(
    id,
    body.taskCodes.map((taskCode) => ({ taskCode, label: skillLabel(taskCode), source: "instructor_selected" as const })),
  );

  return NextResponse.json({ tasks });
}
