import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { getStaffViewer } from "@/lib/auth/staff";

/**
 * Where signing in lands you.
 *
 * Staff go to the staff console, full stop. The previous version checked for
 * staff but only acted on it when getViewer() threw -- i.e. only when the
 * staff account happened to have no organization membership. Any membership
 * at all, including a leftover student one from testing, sent AfterFlight's
 * own superadmin into a customer's product as a student, which is precisely
 * the arrangement getStaffViewer() exists to avoid.
 */
export default async function RootPage() {
  const staff = await getStaffViewer();
  if (staff) redirect("/super-admin");

  let viewer;
  try {
    viewer = await getViewer();
  } catch {
    throw new Error("Signed in, but not an active member of any organization.");
  }

  if (viewer.role === "instructor") redirect("/cfi/today");
  if (viewer.role === "admin") redirect("/admin/overview");
  redirect("/home");
}
