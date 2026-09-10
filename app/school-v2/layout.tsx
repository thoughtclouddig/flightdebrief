import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SchoolV2Shell } from "@/components/school-v2/shell";
import { isSuperadmin } from "@/lib/superadmin";
import { getViewer } from "@/lib/viewer";

/**
 * School V2's own layout, not nested under canonical app/(product)/admin/**
 * -- same reasoning as app/cfi-v2/layout.tsx: the approved, released School
 * experience, no fixture mode, always a real authenticated admin session,
 * just a different route tree and presentation. Canonical
 * app/(product)/admin/** stays completely untouched.
 *
 * Role gate matches canonical app/(product)/admin/layout.tsx exactly
 * (viewer.role === "admin", or the platform-level superadmin carve-out) so
 * School V2 is reachable by exactly the same people canonical /admin/** is
 * -- no wider, no narrower. No environment gate -- role/ownership is the
 * only thing standing between a viewer and this route.
 */
export default async function SchoolV2Layout({ children }: { children: ReactNode }) {
  let viewer;
  try {
    viewer = await getViewer();
  } catch {
    redirect("/login?from=%2Fschool-v2&reason=no-session");
  }
  if (viewer.role !== "admin" && !isSuperadmin(viewer.user.email)) notFound();

  return (
    <SchoolV2Shell organizationName={viewer.organization.name} viewerName={viewer.user.name}>
      {children}
    </SchoolV2Shell>
  );
}
