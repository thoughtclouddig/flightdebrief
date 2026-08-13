import { NextResponse } from "next/server";
import { getViewer, type Viewer } from "@/lib/viewer";
import type { OrgRole } from "@/lib/types";

/**
 * API-route auth guard. proxy.ts only protects pages -- every API route must
 * authorize itself. Returns the viewer, or a ready-to-return 401/403 response.
 */
export async function authorize(
  requiredRole?: OrgRole | OrgRole[],
): Promise<{ viewer: Viewer; response?: undefined } | { viewer?: undefined; response: NextResponse }> {
  let viewer: Viewer;
  try {
    viewer = await getViewer();
  } catch {
    return { response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(viewer.role)) {
      return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { viewer };
}
