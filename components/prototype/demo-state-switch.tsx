"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Prototype-only. Lets a reviewer see both Home states without seeding two
 * accounts.
 *
 * This is scaffolding, not product: it lives in the prototype banner rather
 * than anywhere a student would look, because the real app derives the state
 * from whether the last flight has a debrief attached.
 */
export function DemoStateSwitch() {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pathname !== "/prototype/vector") return null;
  const state = params.get("state");
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-sunken p-0.5">
      <Opt href="/prototype/vector?state=detected" active={state === "detected"}>
        Detected
      </Opt>
      <Opt href="/prototype/vector?state=flown" active={state === "flown"}>
        Just flew
      </Opt>
      <Opt href="/prototype/vector" active={!state}>
        Between
      </Opt>
    </div>
  );
}

function Opt({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active ? "bg-surface text-foreground shadow-sm shadow-black/5" : "text-foreground-faint",
      )}
    >
      {children}
    </Link>
  );
}
