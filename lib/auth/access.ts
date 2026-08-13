import { getRepository } from "@/lib/data";
import { getViewer, type Viewer } from "@/lib/viewer";
import { canAccessRecord } from "@/lib/auth/guard";
import type { FlightWithRelations } from "@/lib/types";

/**
 * Centralized, authorized flight lookup for ID-addressed views.
 * Returns the flight only when the signed-in viewer owns it or is an
 * instructor/admin in the flight's organization; otherwise null so
 * callers can render notFound()/404 without leaking which ids exist.
 */
export async function getAuthorizedFlight(
  id: string,
): Promise<{ viewer: Viewer; flight: FlightWithRelations } | null> {
  const viewer = await getViewer();
  const flight = await getRepository().getFlight(id);
  if (!flight || !canAccessRecord(viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return null;
  }
  return { viewer, flight };
}

/**
 * Authorized student lookup for CFI views: the viewer must be an
 * instructor/admin, and the student must be a member of the viewer's
 * organization. Returns null when unauthorized or not found.
 */
export async function getAuthorizedStudent(studentId: string) {
  const viewer = await getViewer();
  if (viewer.role !== "instructor" && viewer.role !== "admin") return null;

  const repo = getRepository();
  const student = await repo.getUser(studentId);
  if (!student) return null;

  const memberships = await repo.listMembershipsForUser(studentId);
  const inOrg = memberships.some((m) => m.organizationId === viewer.organization.id);
  if (!inOrg) return null;

  return { viewer, student, memberships };
}
