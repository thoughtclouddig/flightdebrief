"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the server component tree via router.refresh() while mounted --
 * for screens waiting on someone else's action (the other party submitting
 * an assessment, a CFI finishing a debrief) where a manual reload was
 * previously the only way to see the state change. Renders nothing.
 */
export function AutoRefresh({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
