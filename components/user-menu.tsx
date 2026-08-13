"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Viewer } from "@/lib/viewer";

export function UserMenu({ viewer, compact = false }: { viewer: Viewer; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function signOut() {
    setSigningOut(true);
    // Full navigation (not router.push) -- /api/auth/logout clears the
    // session cookie and signs out of Replit Auth, then redirects home.
    window.location.href = "/api/auth/logout";
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
          <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-hairline bg-surface py-1 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-foreground">{viewer.user.name}</p>
              <p className="truncate text-xs capitalize text-foreground-faint">{viewer.role}</p>
            </div>
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
