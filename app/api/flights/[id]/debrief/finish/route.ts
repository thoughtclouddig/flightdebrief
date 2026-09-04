import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { evaluateAndAwardMilestones } from "@/lib/milestones";

/**
 * Marks a guided/light-mode debrief complete once the CFI has walked through
 * the generated summary with the student on /review -- see the analyze
 * route's guidanceMode check, which skips the immediate complete-flip for
 * anything but freeform mode specifically so this endpoint is the one place
 * that finalizes a debrief.
 *
 * A verified instructor/admin can always finish. So can the flight's own
 * student, but only when the instructor assessment on this flight was a
 * same-phone guest handoff (see lib/auth/assessment-access.ts) -- there is
 * no verified CFI account for this flight, so nobody else ever could finish
 * it. A student on a flight with a real, separately-authenticated CFI still
 * cannot finish it themselves.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/flights/[id]/debrief/finish">) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const isVerifiedInstructor = auth.viewer.role === "instructor" || auth.viewer.role === "admin";
  if (!isVerifiedInstructor) {
    const instructorAssessment = await repo.getAssessment(id, "instructor");
    const guestEligible = auth.viewer.user.id === flight.userId && instructorAssessment?.attribution === "guest_handoff";
    if (!guestEligible) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) {
    return NextResponse.json({ error: "No debrief has been recorded for this flight yet." }, { status: 400 });
  }

  await repo.setFlightDebriefStatus(id, "complete");
  await evaluateAndAwardMilestones(repo, flight.userId, id);

  return NextResponse.json({ ok: true });
}
