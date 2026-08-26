"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires one best-effort beacon per marketing pageview so we can see which
 * pages get traffic from AI answer engines (see lib/ai-discovery). No
 * cookies, no localStorage, no IP/user-agent capture -- just path + referrer.
 */
export function ReferralTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/analytics/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
    }).catch(() => {
      // Best-effort only -- a failed beacon should never affect the visitor's page.
    });
  }, [pathname]);

  return null;
}
