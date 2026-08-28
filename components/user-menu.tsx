"use client";

import { useState } from "react";
import { ChevronDown, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { homeHrefForRole } from "@/components/nav";
import type { MembershipOption, Viewer } from "@/lib/viewer";

const ROLE_LABELS: Record<Viewer["role"], string> = {
  student: "Student",
  instructor: "Instructor",
  admin: "Admin",
};

/** Full navigation, not router.push -- every server component down the tree needs a fresh getViewer() read of the switched-membership cookie. */
function navigateTo(href: string) {
  window.location.href = href;
}

export function UserMenu({
  viewer,
  memberships,
  compact = false,
}: {
  viewer: Viewer;
  memberships: MembershipOption[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  /** Same org twice (an independent CFI's admin + instructor) isn't two organizations. */
  const distinctOrgCount = new Set(memberships.map((m) => m.organizationId)).size;
  const [signingOut, setSigningOut] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  function signOut() {
    setSigningOut(true);
    // Full navigation (not router.push) -- /api/auth/logout clears the
    // session cookie and signs out of Replit Auth, then redirects home.
    window.location.href = "/api/auth/logout";
  }

  async function switchTo(option: MembershipOption) {
    setSwitching(option.membershipId);
    let ok = false;
    try {
      const res = await fetch("/api/auth/switch-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: option.membershipId }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (ok) {
      // Full navigation -- every server component down the tree needs a
      // fresh getViewer() read of the new cookie, not a client-side route.
      navigateTo(homeHrefForRole(option.role));
    } else {
      setSwitching(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-foreground",
          compact && "px-2.5 py-1",
        )}
      >
        <span className={cn("max-w-[9rem] truncate", compact && "max-w-[6rem]")}>{viewer.user.name}</span>
        <ChevronDown className="size-3.5 shrink-0 text-foreground-faint" />
      </button>

      {open ? (
        <>
          <button aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-hairline bg-surface py-1 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-foreground">{viewer.user.name}</p>
              <p className="truncate text-xs capitalize text-foreground-faint">{viewer.role}</p>
            </div>

            {memberships.length > 1 ? (
              <div className="border-t border-hairline py-1">
                {/* These are memberships, not organizations. An independent CFI
                    holds two in the SAME org (admin + instructor), so heading
                    them "Organizations" and printing the org name twice reads
                    as two businesses. Only call it that when they really are
                    different orgs -- otherwise it's a role switch. */}
                <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-faint">
                  {distinctOrgCount > 1 ? "Organizations" : "Switch role"}
                </p>
                {memberships.map((m) => {
                  const isCurrent = m.organizationId === viewer.organization.id && m.role === viewer.role;
                  return (
                    <button
                      key={m.membershipId}
                      onClick={() => (isCurrent ? undefined : switchTo(m))}
                      disabled={switching === m.membershipId}
                      className={cn(
                        "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-sunken disabled:opacity-60",
                        isCurrent ? "bg-brand/5" : "text-foreground-soft",
                      )}
                    >
                      {/* w-full so truncate has a width to work against -- without
                          it the name just overflowed and got clipped by the
                          menu's overflow-hidden. */}
                      <span className={cn("w-full truncate", isCurrent && "font-medium text-foreground")}>
                        {distinctOrgCount > 1 ? m.organizationName : ROLE_LABELS[m.role]}
                      </span>
                      <span className="w-full truncate text-xs text-foreground-faint">
                        {distinctOrgCount > 1 ? ROLE_LABELS[m.role] : m.organizationName}
                        {isCurrent ? " · current" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {viewer.organization.kind !== "independent_cfi" &&
            (viewer.organization.kind !== "school" || viewer.role === "admin") &&
            !viewer.organization.demoExpiresAt ? (
              <a
                href="/billing"
                className="flex w-full items-center gap-2 border-t border-hairline px-3 py-2 text-left text-sm text-foreground-soft hover:bg-surface-sunken"
              >
                <CreditCard className="size-3.5" />
                Billing
              </a>
            ) : null}

            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 border-t border-hairline px-3 py-2 text-left text-sm text-foreground-soft hover:bg-surface-sunken disabled:opacity-60"
            >
              <LogOut className="size-3.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
