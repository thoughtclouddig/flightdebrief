import { NextResponse } from "next/server";
import { getViewer, type Viewer } from "@/lib/viewer";
import type { OrgRole } from "@/lib/types";

/**
 * API-route auth guard. proxy.ts only protects pages -- every API route must
 * authorize itself. Returns the viewer, or a ready-to-return 401/403 response.
 */
export async function authorize(
  requiredRole?: OrgRole | OrgRole[],
  options?: { allowIncompleteProfile?: boolean },
): Promise<{ viewer: Viewer; response?: undefined } | { viewer?: undefined; response: NextResponse }> {
  let viewer: Viewer;
  try {
    viewer = await getViewer();
  } catch {
    return { response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  // Onboarding is mandatory: incomplete profiles may only hit the routes
  // that explicitly opt in (the onboarding endpoint itself).
  if (!viewer.user.profileCompleted && !options?.allowIncompleteProfile) {
    return { response: NextResponse.json({ error: "Profile incomplete" }, { status: 403 }) };
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(viewer.role)) {
      return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { viewer };
}

/**
 * Record-level access check: the viewer may access a record if they own it,
 * or if they are an instructor/admin in the record's organization.
 */
export function canAccessRecord(
  viewer: Viewer,
  record: { studentId: string; organizationId: string | null },
): boolean {
  if (record.studentId === viewer.user.id) return true;
  return (
    (viewer.role === "instructor" || viewer.role === "admin") &&
    record.organizationId === viewer.organization.id
  );
}

/** Ready-to-return 404 so callers don't leak which ids exist. */
export function recordNotFound(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
