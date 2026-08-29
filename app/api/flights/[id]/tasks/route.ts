import { NextResponse } from "next/server";
import { withUniversalTasks } from "@/lib/universal-tasks";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface SetTasksBody {
  /** taskCode is a catalog TrainingSkill or a "CUSTOM:<id>" code from the task picker's Add custom tile -- label is always client-supplied (skillLabel() only knows the fixed catalog, not a custom label). */
  tasks: { taskCode: string; label: string }[];
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
  if (!Array.isArray(body.tasks) || body.tasks.length === 0) {
    return NextResponse.json({ error: "At least one task is required" }, { status: 400 });
  }
  if (body.tasks.some((t) => !t.taskCode?.trim() || !t.label?.trim())) {
    return NextResponse.json({ error: "Each task needs a code and a label" }, { status: 400 });
  }

  // Preflight, radio and situational awareness are appended here rather than
  // left to the picker. They happen on every flight whatever the lesson was,
  // and a CFI selecting today's objective never picks them -- so they were
  // never rated, on any flight. See lib/universal-tasks.ts.
  const tasks = await repo.setFlightTasks(
    id,
    withUniversalTasks(
      body.tasks.map((t) => ({
        taskCode: t.taskCode,
        label: t.label,
        source: "instructor_selected" as const,
      })),
    ),
  );

  return NextResponse.json({ tasks });
}
