import { ORG_FALCON, USER_ANDY, USER_DANNY, USER_JORDAN } from "@/lib/data/seed";
import type { Organization, OrgRole, User } from "@/lib/types";

export interface Viewer {
  user: User;
  organization: Organization;
  role: OrgRole;
}

export const VIEWER_COOKIE_NAME = "flightbrief_viewer";

/** Demo-only: the roles a viewer can switch between without a real login. Client-safe (no next/headers). */
export const VIEWER_OPTIONS: { userId: string; organizationId: string; role: OrgRole; label: string }[] = [
  { userId: USER_ANDY.id, organizationId: ORG_FALCON.id, role: "student", label: `${USER_ANDY.name} · Student` },
  { userId: USER_DANNY.id, organizationId: ORG_FALCON.id, role: "instructor", label: `${USER_DANNY.name} · CFI` },
  { userId: USER_JORDAN.id, organizationId: ORG_FALCON.id, role: "admin", label: `${USER_JORDAN.name} · Admin` },
];
