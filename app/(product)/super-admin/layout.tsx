import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { isSuperadmin } from "@/lib/superadmin";

/**
 * Platform-level admin -- independent of viewer.role/viewer.organization
 * (a superadmin's active membership, if any, is irrelevant here). See
 * lib/superadmin.ts.
 */
const SECTIONS = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/schools", label: "Schools" },
  { href: "/super-admin/subscribers", label: "Subscribers" },
  { href: "/super-admin/ideas", label: "Ideas" },
  { href: "/super-admin/articles", label: "Articles" },
  { href: "/super-admin/research", label: "Research" },
  { href: "/super-admin/ai-referrals", label: "AI Referrals" },
];

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!isSuperadmin(viewer.user.email)) notFound();
  return (
    <div className="flex flex-col gap-6">
      {/* These pages were reachable only by typed URL. They're AfterFlight's
          own console, so they need their own navigation -- the product nav
          belongs to whichever customer org the viewer is acting in. */}
      <nav className="flex flex-wrap gap-1 border-b border-hairline pb-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground-soft transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            {section.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
