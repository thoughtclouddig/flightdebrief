import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { isSuperadmin } from "@/lib/superadmin";

/**
 * Platform-level admin -- independent of viewer.role/viewer.organization
 * (a superadmin's active membership, if any, is irrelevant here). See
 * lib/superadmin.ts.
 */
export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!isSuperadmin(viewer.user.email)) notFound();
  return <>{children}</>;
}
