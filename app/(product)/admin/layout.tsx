import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { isSuperadmin } from "@/lib/superadmin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  // Content (articles/research) isn't scoped to any one organization, so a
  // company superadmin can reach it here even if their active membership
  // isn't an org admin -- see lib/superadmin.ts.
  if (viewer.role !== "admin" && !isSuperadmin(viewer.user.email)) notFound();
  return <>{children}</>;
}
