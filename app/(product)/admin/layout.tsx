import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (viewer.role !== "admin") notFound();
  return <>{children}</>;
}
