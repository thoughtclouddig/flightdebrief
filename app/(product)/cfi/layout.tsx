import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";

export default async function CfiLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (viewer.role !== "instructor") notFound();
  return <>{children}</>;
}
