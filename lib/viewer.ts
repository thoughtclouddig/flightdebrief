import { cookies } from "next/headers";
import { getRepository } from "@/lib/data";
import { DEMO_USER_ID, ORG_FALCON } from "@/lib/data/seed";
import { VIEWER_COOKIE_NAME, type Viewer } from "@/lib/viewer-options";
import type { OrgRole } from "@/lib/types";

export type { Viewer } from "@/lib/viewer-options";
export { VIEWER_COOKIE_NAME, VIEWER_OPTIONS } from "@/lib/viewer-options";

interface ViewerCookiePayload {
  userId: string;
  organizationId: string;
  role: OrgRole;
}

function defaultPayload(): ViewerCookiePayload {
  return { userId: DEMO_USER_ID, organizationId: ORG_FALCON.id, role: "student" };
}

/**
 * This prototype has no real login (see supabase/schema.sql's note on auth).
 * "Viewer" stands in for a session: which user, in which organization, under
 * which role, is currently looking at the app. Stored in a cookie so server
 * components can read it synchronously; changed via the switcher in the nav.
 * Server-only -- see lib/viewer-options.ts for the client-safe pieces.
 */
export async function getViewer(): Promise<Viewer> {
  const store = await cookies();
  const raw = store.get(VIEWER_COOKIE_NAME)?.value;
  let payload = defaultPayload();

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ViewerCookiePayload>;
      if (parsed.userId && parsed.organizationId && parsed.role) {
        payload = parsed as ViewerCookiePayload;
      }
    } catch {
      // malformed cookie -- fall through to default
    }
  }

  const repo = getRepository();
  const [user, organization] = await Promise.all([
    repo.getUser(payload.userId),
    repo.getOrganization(payload.organizationId),
  ]);

  if (user && organization) {
    return { user, organization, role: payload.role };
  }

  // Cookie pointed at something that no longer exists (e.g. stale seed) -- fall back cleanly.
  const fallback = defaultPayload();
  const [fallbackUser, fallbackOrg] = await Promise.all([
    repo.getUser(fallback.userId),
    repo.getOrganization(fallback.organizationId),
  ]);
  return { user: fallbackUser!, organization: fallbackOrg!, role: fallback.role };
}
