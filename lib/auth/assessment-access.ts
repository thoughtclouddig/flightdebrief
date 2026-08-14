import { NextResponse } from "next/server";
import type { Viewer } from "@/lib/viewer";
import type { AssessmentRole, FlightWithRelations } from "@/lib/types";

/**
 * Independent-assessment access rule: a student may only act on their own
 * "student" assessment; an instructor/admin in the flight's org may only act
 * on the "instructor" assessment. Neither can act as the other role, which is
 * what keeps the two assessments genuinely independent.
 */
export function assertAssessmentRole(
  viewer: Viewer,
  flight: FlightWithRelations,
  role: string,
): { role: AssessmentRole; response?: undefined } | { role?: undefined; response: NextResponse } {
  if (role !== "student" && role !== "instructor") {
    return { response: NextResponse.json({ error: "Invalid role" }, { status: 400 }) };
  }
  if (role === "student" && viewer.user.id !== flight.userId) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (role === "instructor" && viewer.role !== "instructor" && viewer.role !== "admin") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { role };
}
