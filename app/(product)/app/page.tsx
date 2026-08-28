import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { getStaffViewer } from "@/lib/auth/staff";

export default async function RootPage() {
  // Staff have no organization, so getViewer would throw. Check first and
  // send them to their own console rather than into the product.
  const staff = await getStaffViewer();

  let viewer;
  try {
    viewer = await getViewer();
  } catch {
    if (staff) redirect("/super-admin");
    throw new Error("Signed in, but not an active member of any organization.");
  }

  if (viewer.role === "instructor") redirect("/cfi/today");
  if (viewer.role === "admin") redirect("/admin/overview");
  redirect("/home");
}
