import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";

export default async function RootPage() {
  const viewer = await getViewer();
  if (viewer.role === "instructor") redirect("/cfi/today");
  if (viewer.role === "admin") redirect("/admin/overview");
  redirect("/home");
}
