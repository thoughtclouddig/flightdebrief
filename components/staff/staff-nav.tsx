"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The staff console's own header. Deliberately not components/nav.tsx: that
 * one is built around a viewer's role inside a customer organization, and
 * shows Home / Flights / Skills, none of which mean anything here.
 *
 * Visually distinct on purpose -- a dark bar rather than the product's light
 * one -- because the most dangerous confusion in this app is not knowing
 * whether you're looking at AfterFlight's data or one customer's.
 */
const SECTIONS = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/schools", label: "Schools" },
  { href: "/super-admin/subscribers", label: "Subscribers" },
  // One entry, not three. Ideas, articles, and research were separate
  // destinations for stages of the same job, which is what made it unclear
  // where an approved idea ended up. The desk holds all of them.
  { href: "/super-admin/articles", label: "Content" },
  { href: "/super-admin/ai-referrals", label: "AI Referrals" },
];

export function StaffNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-[#101727]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-lg font-bold text-white">AfterFlight</span>
            <span className="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#101727]">
              Staff
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/60 sm:inline" title={email}>
              {name}
            </span>
            <Link href="/api/auth/logout" className="text-sm font-medium text-white/60 hover:text-white">
              Sign out
            </Link>
          </div>
        </div>
        <nav className="-mx-1 flex flex-wrap gap-0.5">
          {SECTIONS.map((section) => {
            // Overview matches exactly; the rest match their subtree so a
            // detail page keeps its section lit.
            const active =
              section.href === "/super-admin" ? pathname === section.href : pathname.startsWith(section.href);
            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
