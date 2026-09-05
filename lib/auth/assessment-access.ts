import { NextResponse } from "next/server";
import type { Viewer } from "@/lib/viewer";
import type { Repository } from "@/lib/data/types";
import type { AssessmentAttribution, AssessmentRole, FlightTaskSource, FlightWithRelations } from "@/lib/types";

/**
 * Independent-assessment access rule: a student may only act on their own
 * "student" assessment. The "instructor" assessment can be entered by either
 * of two genuinely different parties, and the caller must know which one
 * actually happened -- see attribution below.
 *
 * A CFI does not need an AfterFlight account to take part in AfterFlight is
 * student-owned: a student must be able to fly with any instructor, signed up
 * or not, and still complete a debrief. So the second, real path is a
 * same-phone guest handoff -- the student's own authenticated session,
 * entering the instructor's ratings after handing them the phone -- gated on
 * their own assessment already being submitted (that gate is what makes this
 * "their part is done, now it's the instructor's turn", not a blanket
 * "students may also act as instructors" rule). It is intentionally scoped to
 * exactly this: this flight, this debrief, instructor-assessment actions
 * only. It grants nothing else -- not the CFI dashboard, not other students'
 * data, not other flights, not org administration -- because nothing else
 * ever checks this function.
 *
 * Either way, the caller must persist which happened (see attribution on
 * DebriefAssessment) rather than silently treating a guest submission as
 * account-verified.
 */
export function assertAssessmentRole(
  viewer: Viewer,
  flight: FlightWithRelations,
  role: string,
  studentAssessmentSubmitted: boolean,
):
  | { role: AssessmentRole; attribution: AssessmentAttribution; response?: undefined }
  | { role?: undefined; attribution?: undefined; response: NextResponse } {
  if (role !== "student" && role !== "instructor") {
    return { response: NextResponse.json({ error: "Invalid role" }, { status: 400 }) };
  }
  if (role === "student") {
    if (viewer.user.id !== flight.userId) {
      return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { role, attribution: "account_verified" };
  }
  // role === "instructor"
  if (viewer.role === "instructor" || viewer.role === "admin") {
    return { role, attribution: "account_verified" };
  }
  if (viewer.user.id === flight.userId && studentAssessmentSubmitted) {
    return { role, attribution: "guest_handoff" };
  }
  return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

/**
 * Who may (re)set a flight's task list, and what provenance their submission
 * gets. Milestone 2A: a student is no longer stuck behind a CFI who hasn't
 * visited the task picker -- they may initialize their OWN flight's empty
 * task set themselves (confirming what was worked on), scoped narrowly:
 *
 * - only when the flight has no tasks yet (never overwrites an existing
 *   list -- neither the CFI's nor an earlier student submission)
 * - only their own flight (`viewer.user.id === flight.userId`)
 * - locked out entirely once their own assessment is submitted, same as the
 *   CFI -- the whole point of independent assessment is that both parties
 *   rate the same, frozen scope (see the "student-first rating order" vs
 *   "student-first debrief initialization" distinction: this function is
 *   about the latter).
 *
 * An instructor/admin keeps unrestricted set/revise rights right up until
 * that same lock -- the existing CFI task picker remains valid as an
 * optional pre-seeding mechanism, just no longer a prerequisite.
 */
export function assertCanSetFlightTasks(
  viewer: Viewer,
  flight: FlightWithRelations,
  existingTaskCount: number,
  studentAssessmentSubmitted: boolean,
): { ok: true; source: FlightTaskSource; response?: undefined } | { ok?: undefined; source?: undefined; response: NextResponse } {
  if (studentAssessmentSubmitted) {
    return {
      response: NextResponse.json(
        { error: "The assessment scope is locked once the student has submitted." },
        { status: 409 },
      ),
    };
  }
  if (viewer.role === "instructor" || viewer.role === "admin") {
    return { ok: true, source: "instructor_selected" };
  }
  if (viewer.user.id === flight.userId) {
    if (existingTaskCount > 0) {
      return { response: NextResponse.json({ error: "Tasks already exist for this flight." }, { status: 409 }) };
    }
    return { ok: true, source: "student_confirmed" };
  }
  return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

/**
 * Everything downstream of both assessments being in -- recording, card
 * controls, finishing the debrief -- is normally CFI-only. On a guest-
 * handoff flight there is no separate verified CFI session to require, so
 * the same student who did the handoff is the only one who ever could act
 * here. A student on a flight with a real, separately-authenticated CFI
 * still cannot act as one themselves -- this checks the actual attribution
 * on file, not just "is this the flight's student."
 */
export async function assertCanActAsInstructor(
  repo: Repository,
  viewer: Viewer,
  flight: FlightWithRelations,
): Promise<{ ok: true; response?: undefined } | { ok?: undefined; response: NextResponse }> {
  if (viewer.role === "instructor" || viewer.role === "admin") {
    return { ok: true };
  }
  if (viewer.user.id === flight.userId) {
    const instructorAssessment = await repo.getAssessment(flight.id, "instructor");
    if (instructorAssessment?.attribution === "guest_handoff") {
      return { ok: true };
    }
  }
  return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}
