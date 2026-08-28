"use client";

import { useSyncExternalStore } from "react";

/** Never re-subscribes -- this store's value is constant per environment. */
const noopSubscribe = () => () => {};

/**
 * Renders a stored ISO instant (a reservation's scheduledStart, say) in the
 * viewer's own timezone without tripping a hydration mismatch.
 *
 * The problem this solves: server-rendering `new Date(iso).toLocaleString()`
 * formats in the SERVER's timezone (UTC in deployment) while the browser
 * formats in the user's, so hydration saw "Fri, Aug 28, 4:00 PM" from the
 * server and "Fri, Aug 28 at 9:00 AM" on the client and threw out the tree.
 * For an app whose whole job is when-is-your-next-lesson, silently showing a
 * time seven hours off is the real damage; the console error was just how it
 * surfaced.
 *
 * useSyncExternalStore is the sanctioned way to render one value during SSR
 * and hydration and another afterward: getServerSnapshot() feeds both the
 * server render and the first client render, so they match byte-for-byte,
 * then React re-renders with getSnapshot(). suppressHydrationWarning alone
 * would not work -- React keeps the SERVER text on a suppressed mismatch,
 * which is exactly the wrong value here.
 */
export function LocalDateTime({
  iso,
  options,
  className,
}: {
  iso: string;
  options: Intl.DateTimeFormatOptions;
  className?: string;
}) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const text = new Date(iso).toLocaleString("en-US", hydrated ? options : { ...options, timeZone: "UTC" });

  return <span className={className}>{text}</span>;
}
