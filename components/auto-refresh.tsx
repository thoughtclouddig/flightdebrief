"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps a server-rendered waiting screen current while someone else acts (the
 * other party submitting an assessment, a CFI hitting Finish), so a manual
 * reload is never the only way to see the state change. Renders nothing.
 *
 * Polling alone isn't enough on a phone. Mobile browsers suspend or heavily
 * throttle setInterval in a backgrounded tab, and they do NOT run the missed
 * ticks on return -- so a student whose screen locked during the debrief came
 * back to a stale "waiting on your instructor" page indefinitely, which is
 * exactly when this component matters most. Refreshing on visibilitychange
 * and focus covers that: whatever happened while the tab was away is picked
 * up the instant it's looked at again.
 */
export function AutoRefresh({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      // Don't burn a request on a tab nobody is looking at -- the
      // visibility handler below catches it up on return anyway.
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [router, intervalMs]);

  return null;
}
