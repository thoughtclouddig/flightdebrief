import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaffViewer } from "@/lib/auth/staff";
import { StaffNav } from "@/components/staff/staff-nav";

/**
 * AfterFlight's console. Gated on the email allowlist alone (lib/superadmin.ts)
 * via getStaffViewer, which -- unlike getViewer -- doesn't require the viewer
 * to be a member of any organization. Staff aren't customers.
 */
export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const staff = await getStaffViewer();
  // 404, not 403: someone who isn't staff has no business learning that these
  // screens exist.
  if (!staff) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-sunken">
      <StaffNav name={staff.user.name} email={staff.user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
