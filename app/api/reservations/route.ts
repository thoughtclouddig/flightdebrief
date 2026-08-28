import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface CreateReservationBody {
  studentId: string;
  aircraftId: string;
  scheduledStart: string;
  scheduledEnd: string;
  /** Optional -- defaults to the calling CFI. Lets a school schedule a lesson for whoever is actually teaching it. */
  instructorId?: string;
}

/**
 * App-originated reservation scheduling -- see the doc comment on
 * Repository.createReservation. Instructor/admin only. The reservation's
 * instructor defaults to the caller but can be any active instructor in the
 * same org -- at a school the person scheduling often isn't the person
 * teaching, and silently assigning the caller was producing reservations
 * credited to the wrong CFI. Available for every org kind, including
 * schools -- see components/student-training-detail.tsx's canScheduleLessons
 * doc comment for why the earlier school-org block was lifted.
 */
export async function POST(request: Request) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  const body = (await request.json()) as CreateReservationBody;
  if (!body.studentId || !body.aircraftId || !body.scheduledStart || !body.scheduledEnd) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (new Date(body.scheduledEnd).getTime() <= new Date(body.scheduledStart).getTime()) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const repo = getRepository();
  const student = await repo.getUser(body.studentId);
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const memberships = await repo.listMembershipsForUser(student.id);
  if (!memberships.some((m) => m.organizationId === viewer.organization.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Any active instructor in the caller's own org, or the caller. Never a
  // bare trust of the submitted id -- that would let one org schedule onto
  // another org's instructor.
  let instructorId = viewer.user.id;
  if (body.instructorId && body.instructorId !== viewer.user.id) {
    const orgInstructors = await repo.listMembers(viewer.organization.id, "instructor");
    const match = orgInstructors.find((m) => m.userId === body.instructorId && m.status === "active");
    if (!match) return NextResponse.json({ error: "Unknown instructor" }, { status: 400 });
    instructorId = match.userId;
  }

  const aircraft = await repo.getAircraft(body.aircraftId);
  if (!aircraft || aircraft.organizationId !== viewer.organization.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reservation = await repo.createReservation({
    organizationId: viewer.organization.id,
    studentId: student.id,
    instructorId,
    aircraftId: aircraft.id,
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd,
  });

  return NextResponse.json({ reservation });
}
